import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {ThemedText} from "@/components/ThemedText";
import {useVideoPlayer, VideoView} from "expo-video";
import {Colors} from "@/constants/Colors";
import {router, useLocalSearchParams} from "expo-router";
import {useColorScheme} from "@/hooks/useColorScheme";
import {useToast} from "@/hooks/useToast";
import ReturnButton from "@/components/ReturnButton";
import i18n from "@/languages/language-config";
import {useAppDispatch, useAppSelector} from "@/store/hooks";
import {uploadFile} from "@/store/fileThunks";
import {selectUploadStatus} from "@/store/file";

const { width, height } = Dimensions.get("window");


export default function AddVideoScreen() {
  const [isSelectedVideo, setIsSelectedVideo] = useState<boolean>(false);
  const [videoUrl, setvideoUrl] = useState<string | null>(null);

  const { uuid } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const styles = colorScheme === "dark" ? darkStyles : lightStyles;

  const [text, setText] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

  const { showToast } = useToast();
  const dispatch = useAppDispatch();
  const fileUploadStatus = useAppSelector(selectUploadStatus);

  const pickVideo = async () => {
    player.pause()
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission d\'accès à la galerie requise.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
    });

    if (!result.canceled) {
      setIsSelectedVideo(true);
      player.replace(result.assets[0].uri);
      setvideoUrl(result.assets[0].uri)
    }
  };

  const player = useVideoPlayer(null, player => {
    player.play();
  });

  const handleSaveVideo = () => {
    if (videoUrl == "" || videoUrl == null) {
      showToast("error", i18n.t('toastStatus.error'), i18n.t('addVideo.error.videoMissing'));
      router.back();
      return;
    }
    if (text == "" || text == null) {
      showToast("error", i18n.t('toastStatus.error'), i18n.t('addVideo.error.nameMissing'));
      router.back();
      return;
    }
    
    const treatmentPlaceId = uuid as string;
    
    // Upload the video file
    dispatch(uploadFile({ file: videoUrl, treatmentPlaceId }));
    router.back();
  };

  useEffect(() => {
    if (fileUploadStatus === "succeeded") {
      showToast("success", i18n.t('toastStatus.success'), i18n.t('addVideo.toast.success'));
    } else if (fileUploadStatus === "failed") {
      showToast("error", i18n.t('toastStatus.error'), i18n.t('addVideo.toast.error'));
    }
  }, [fileUploadStatus]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <ReturnButton />
        <View style={styles.formContainer}>
          <ThemedText style={styles.titleModal}>{i18n.t("addVideo.title")}</ThemedText>
          <View>
            <View style={styles.labelContainer}>
              <ThemedText style={styles.label}>{i18n.t("addVideo.nameInput")}</ThemedText>
            </View>
            <TextInput
              style={[styles.input, { height: inputHeight }]}
              placeholder={i18n.t("addVideo.nameInput")}
              placeholderTextColor="grey"
              multiline
              value={text}
              onChangeText={setText}
              onContentSizeChange={(event) =>
                setInputHeight(event.nativeEvent.contentSize.height)
              }
            />
          </View>
          <View style={styles.imageContainer}>
            {isSelectedVideo && <VideoView player={player} style={styles.video}/>}
            <TouchableOpacity style={styles.chooseButton} onPress={pickVideo}>
              <ThemedText>{i18n.t("addVideo.chooseBtn")}</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.button} onPress={handleSaveVideo}>
              <ThemedText>{i18n.t("addVideo.addBtn")}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const sharedStyles = {
  formContainer: {
    alignItems: "center" as "center",
  },
  titleModal: {
    fontSize: 24,
    marginBottom: height * 0.04,
  },
  label: {
    fontSize: 20,
  },
  labelContainer: {
    alignItems: "center" as "center",
    marginTop: height * 0.04,
    marginBottom: height * 0.02,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    width: width * 0.9,
    minHeight: height * 0.05,
    fontSize: height * 0.03,
    paddingHorizontal: width * 0.01,
  },
  formButtons: {
    marginTop: height * 0.04,
  },
  button: {
    alignItems: "center" as "center",
    justifyContent: "center" as "center",
    borderWidth: 1,
    borderRadius: 10,
    width: width * 0.5,
    height: height * 0.065,
    marginHorizontal: width * 0.02,
  },
  chooseButton: {
    alignItems: "center" as "center",
    justifyContent: "center" as "center",
    borderWidth: 1,
    borderRadius: 10,
    width: width * 0.4,
    height: height * 0.065,
    marginHorizontal: width * 0.02,
  },
  image: {
    width: 175,
    height: 175,
    marginVertical: height * 0.02
  },
  imageContainer:{
    marginVertical: height * 0.02,
    alignItems: "center" as "center"
  },
  video: {
    width: 250,
    height: 150,
    marginVertical: height* 0.02
  },
};


const lightStyles = StyleSheet.create({
  ...sharedStyles,
  input: {
    ...sharedStyles.input,
    backgroundColor: "white",
    borderColor: "grey",
  },
  button: {
    ...sharedStyles.button,
    backgroundColor: Colors.light.primaryBtn,
  },
  chooseButton: {
    ...sharedStyles.chooseButton,
    backgroundColor: Colors.light.secondaryBtn,
  }
});

const darkStyles = StyleSheet.create({
  ...sharedStyles,
  input: {
    ...sharedStyles.input,
    backgroundColor: "#333333",
    borderColor: "grey",
    color: "#f5f5f5",
  },
  button: {
    ...sharedStyles.button,
    backgroundColor: Colors.dark.primaryBtn,
  },
  chooseButton: {
    ...sharedStyles.chooseButton,
    backgroundColor: Colors.dark.secondaryBtn,
  }
});
