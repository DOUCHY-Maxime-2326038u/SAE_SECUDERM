import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { File } from './file.model';
import { S3 } from 'aws-sdk';
import { User } from '../users/users.model';

@Injectable()
export class FileService {
  private s3: S3;
  private bucketName: string;

  constructor(
    @InjectModel(File)
    private readonly fileModel: typeof File, // Используем модель для работы с базой
  ) {
    this.s3 = new S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    // Only run security check in production with real AWS credentials
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.AWS_ACCESS_KEY_ID &&
      !process.env.AWS_ACCESS_KEY_ID.includes('test')
    ) {
      this.ensureBucketSecurity();
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    currentUser: User,
    treatmentPlaceId: string,
  ): Promise<File> {
    try {
      console.log('File service upload started:', { fileName: file.originalname, size: file.size });

      const sanitizedFilename = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\.{2,}/g, '.');

      // 100 MB limit for videos, 10 MB for images
      const maxFileSize = 100 * 1024 * 1024;
      if (file.size > maxFileSize) {
        throw new Error(
          `La taille du fichier dépasse la limite autorisée (${maxFileSize / (1024 * 1024)} Mo). Fichier: ${file.size / (1024 * 1024)} Mo`,
        );
      }

      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/webm',
      ];

      console.log('File mimetype check:', { received: file.mimetype, allowed: allowedMimeTypes });

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Type de fichier non autorisé: ${file.mimetype}`);
      }

      const uploadParams = {
        Bucket: this.bucketName,
        Key: `uploads/${Date.now()}-${sanitizedFilename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      console.log('S3 upload starting:', { bucket: this.bucketName, key: uploadParams.Key });

      const result = await this.s3.upload(uploadParams).promise();

      console.log('S3 upload success:', { location: result.Location });

      const newFile = await this.fileModel.create({
        original_name: sanitizedFilename,
        file_name: uploadParams.Key,
        file_url: result.Location,
        mime_type: file.mimetype,
        size: file.size,
        uploaded_by: currentUser.id,
        treatment_place_id: treatmentPlaceId,
      });

      newFile.file_url = await this.getFileUrl(newFile.file_name);

      console.log('File record created:', { id: newFile.id });

      return newFile;
    } catch (error) {
      console.error('File upload service error:', error);
      throw error;
    }
  }

  // Получение файла по ID
  async getFileById(id: string): Promise<File> {
    return this.fileModel.findByPk(id);
  }

  // Генерация временного URL для скачивания файла
  async getFileUrl(fileName: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Expires: 60 * 15, // Срок действия ссылки 15 минут
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }

  // Удаление файла
  async deleteFile(id: string): Promise<void> {
    const file = await this.getFileById(id);
    if (!file) {
      throw new Error('File not found');
    }

    // Удаляем файл из S3
    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: file.file_name,
      })
      .promise();

    // Удаляем запись из базы данных
    await this.fileModel.destroy({ where: { id } });
  }

  async deleteAllByTreatmentPlaceId(treatmentPlaceId: string): Promise<void> {
    // Find all files associated with the treatment place
    const files = await this.fileModel.findAll({
      where: { treatment_place_id: treatmentPlaceId },
    });

    // Delete each file from S3 and the database
    for (const file of files) {
      // Delete the file from S3
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: file.file_name,
        })
        .promise();

      // Delete the file record from the database
      await this.fileModel.destroy({ where: { id: file.id } });
    }
  }

  async getFilesURLSByTreatmentPlaceId(
    treatmentPlaceId: string,
  ): Promise<any[]> {
    // Find all files associated with the treatment place
    const files = await this.fileModel.findAll({
      where: { treatment_place_id: treatmentPlaceId },
    });

    // Map the files to the required format
    const filesData = await Promise.all(
      files.map(async (file) => {
        const fileUrl = await this.getFileUrl(file.file_name);
        return {
          id: file.id,
          original_name: file.original_name,
          file_url: fileUrl,
          mime_type: file.mime_type,
          size: file.size,
          uploaded_by: file.uploaded_by,
          treatment_place_id: file.treatment_place_id,
        };
      }),
    );

    return filesData;
  }

  async ensureBucketSecurity(): Promise<void> {
    try {
      // Vérifier et appliquer le chiffrement par défaut
      await this.s3
        .putBucketEncryption({
          Bucket: this.bucketName,
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
                BucketKeyEnabled: true,
              },
            ],
          },
        })
        .promise();

      // Bloquer l'accès public
      await this.s3
        .putPublicAccessBlock({
          Bucket: this.bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            IgnorePublicAcls: true,
            BlockPublicPolicy: true,
            RestrictPublicBuckets: true,
          },
        })
        .promise();

      console.log('La sécurité du bucket S3 est configurée correctement');
    } catch (error) {
      console.error(
        'Erreur lors de la configuration de la sécurité du bucket S3:',
        error,
      );
    }
  }
}
