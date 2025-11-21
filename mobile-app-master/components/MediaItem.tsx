import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useColorScheme,
  View,
  Image,
  Modal,
  Platform,
  } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { Entypo } from '@expo/vector-icons';
import {Colors} from "@/constants/Colors";
import Feather from "@expo/vector-icons/Feather";
import {useAppDispatch, useAppSelector} from "@/store/hooks";
import {selectDeleteStatus} from "@/store/file";
import {deleteFile} from "@/store/fileThunks";
import {useToast} from "@/hooks/useToast";
import i18n from "@/languages/language-config";

const { width, height } = Dimensions.get('window');

type MediaItemProps = {
  label: string;
  type: 'image' | 'video';
  uri: string;
  id: string;
};

const MediaItem = (props: MediaItemProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const styles = colorScheme === 'dark' ? darkStyles : lightStyles;

  const dispatch = useAppDispatch();
  const deleteStatus = useAppSelector(selectDeleteStatus);

  const { showToast } = useToast(); // Custom hook for displaying toasts

  const handleOpenModal = (player: VideoPlayer) => {
    setIsModalVisible(true);
    player.play();
  };

  const handleCloseModal = (player: VideoPlayer) => {
    setIsModalVisible(false);
    player.pause();
  };

  // Optimized video player configuration for iOS and Android
  const playerModal = useVideoPlayer(props.uri, (player) => {
    player.loop = false;
    player.muted = false;
    // iOS specific: Use async loading
    if (Platform.OS === 'ios') {
      player.staysActiveInBackground = false;
    }
  });

  const handleOpenDeleteModal = () => {
    setIsDeleteModalVisible(true);
    setIsModalVisible(false);
  };

  const handleConfirmDelete = () => {
    if (props.uri !== '' && props.id !== null) {
      dispatch(deleteFile(props.id));
      if (deleteStatus === 'succeeded') {
        console.log('File deleted');
        showToast("success", i18n.t('toastStatus.success'), i18n.t('mediaItem.toast.success'));
      }
      else if (deleteStatus === 'failed') {
        console.log('Failed to delete file');
        showToast("error", i18n.t('toastStatus.error'), i18n.t('mediaItem.toast.error'));
      }
    }
    setIsDeleteModalVisible(false);
    setIsModalVisible(false);
  }

  return (
    <TouchableOpacity
      style={styles.mainContainer}
      onPress={() => handleOpenModal(playerModal)}
    >
      <View style={styles.mediaWrapper}>
        {props.type === 'video' ? (
          <VideoView
            player={playerModal}
            style={styles.video}
            pointerEvents="none"
            nativeControls={false}
            {...(Platform.OS === 'ios' && { useNativeControls: false })}
          />
        ) : (
          <Image source={{ uri: props.uri }} style={styles.image} />
        )}
        <View style={styles.mediaContainer}>
          <ThemedText style={styles.mediaTypeLabel}>{props.label}</ThemedText>
          <ThemedText style={styles.mediaTypeText}>
            {props.type === 'image' ? i18n.t("mediaItem.imgtype") : i18n.t("mediaItem.videotype")}
          </ThemedText>
        </View>
      </View>

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => handleCloseModal(playerModal)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            onPress={() => handleCloseModal(playerModal)}
            style={styles.closeButton}
          >
            <Entypo name="circle-with-cross" size={30} color={'white'} />
          </TouchableOpacity>
          <View style={styles.modalContent}>
            {props.type === 'video' ? (
              <VideoView
                player={playerModal}
                style={styles.modalVideo}
                nativeControls={true}
                {...(Platform.OS === 'android' && { useNativeControls: true })}
              />
            ) : (
              <Image source={{ uri: props.uri }} style={styles.modalImage} />
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleOpenDeleteModal()}
            >
              <Feather name="trash-2" size={24} color={colorScheme === 'dark' ? 'white' : 'black'}/>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModalContent}>
            <ThemedText style={styles.confirmationText}>{i18n.t("mediaItem.modal.title")}</ThemedText>
            <View style={styles.confirmationButtonsContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmDelete}
              >
                <ThemedText style={styles.confirmButtonText}>{i18n.t("mediaItem.modal.confirmBtn")}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <ThemedText style={styles.cancelButtonText}>{i18n.t("mediaItem.modal.cancelBtn")}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

const sharedStyles = StyleSheet.create({
  mainContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: height * 0.01,
    marginHorizontal: width * 0.02,
    width: width * 0.8,
  },
  mediaWrapper: {
    position: 'relative',
  },
  mediaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mediaTypeText: {
    fontSize: 14,
    color: '#fff',
  },
  mediaTypeLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  image: {
    width: '100%',
    height: height * 0.3,
    borderRadius: 10,
  },
  video: {
    width: '100%',
    height: height * 0.3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: 'black',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
  deleteButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 10,
  },
  confirmationModalContent: {
    width: width * 0.8,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
});

const lightStyles = StyleSheet.create({
  ...sharedStyles,
  mainContainer: {
    ...sharedStyles.mainContainer,
    borderColor: '#000',
  },
  confirmationModalContent: {
    ...sharedStyles.confirmationModalContent,
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.greyBtn,
  },
  cancelButton: {
    ...sharedStyles.cancelButton,
    backgroundColor: Colors.light.greyBtn,
  },
  confirmButton: {
    ...sharedStyles.confirmButton,
    backgroundColor: Colors.light.primaryBtn,
  },
  deleteButton: {
    ...sharedStyles.deleteButton,
    backgroundColor: Colors.light.errorBlockBorder,
  }
});

const darkStyles = StyleSheet.create({
  ...sharedStyles,
  mainContainer: {
    ...sharedStyles.mainContainer,
    borderColor: '#fff',
  },
  confirmationModalContent: {
    ...sharedStyles.confirmationModalContent,
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.greyBtn,
  },
  cancelButton: {
    ...sharedStyles.cancelButton,
    backgroundColor: Colors.dark.greyBtn,
  },
  confirmButton: {
    ...sharedStyles.confirmButton,
    backgroundColor: Colors.dark.primaryBtn,
  },
  deleteButton: {
    ...sharedStyles.deleteButton,
    backgroundColor: Colors.light.errorBlockBorder,
  }
});

export default MediaItem;
