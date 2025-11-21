import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import { handleAxiosError } from './errors';

// Helper function to detect MIME type from file extension
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    // Videos
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'webm': 'video/webm',
    'flv': 'video/x-flv',
    '3gp': 'video/3gpp',
    'm4v': 'video/x-m4v',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};

export const uploadFile = createAsyncThunk(
  'file/uploadFile',
  async (
    { file, treatmentPlaceId }: { file: string; treatmentPlaceId: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      const filename = file.split('/').pop() || 'uploaded_file';
      const mimeType = getMimeType(filename);

      formData.append('file', {
        uri: file,
        name: filename,
        type: mimeType,
      } as any);

      // Add treatment_place_id as a string field, not as part of the file object
      formData.append('treatment_place_id', treatmentPlaceId);

      const response = await api.post('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.file;
    } catch (err) {
      console.error('File upload error:', err);
      const axiosErr = err as any;
      if (axiosErr?.response?.data?.message) {
        console.error('API Error:', axiosErr.response.data.message);
      }
      return handleAxiosError(err, rejectWithValue);
    }
  }
);

export const fetchFilesByTreatmentPlaceId = createAsyncThunk(
  'file/fetchFilesByTreatmentPlaceId',
  async (treatmentPlaceId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/file/urls/${treatmentPlaceId}`);
      console.log(response.data);
      return response.data.files;
    } catch (err) {
      return handleAxiosError(err, rejectWithValue);
    }
  }
);

export const deleteFile = createAsyncThunk(
  'file-notes/deleteFile',
  async (file_id: string, {rejectWithValue}) => {
    try {
      await api.delete(`/file/${file_id}`);
      return file_id;
    } catch (err) {
      return handleAxiosError(err, rejectWithValue);
    }
  }
);