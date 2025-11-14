import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
   StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ReturnButton from "@/components/ReturnButton";
import {ThemedText} from "@/components/ThemedText";
import {router, useLocalSearchParams} from "expo-router";
import {Colors} from "@/constants/Colors";
import {useColorScheme} from "@/hooks/useColorScheme";
import {useToast} from "@/hooks/useToast";
import {useAppDispatch, useAppSelector} from "@/store/hooks";
import {uploadFile} from "@/store/fileThunks";
import {selectUploadStatus} from "@/store/file";
import i18n from "@/languages/language-config";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");


export default function AddImageScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { uuid } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const styles = colorScheme === "dark" ? darkStyles : lightStyles;

  const [text, setText] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

  const { showToast } = useToast();

  const dispatch = useAppDispatch();

  const fileUploadStatus = useAppSelector(selectUploadStatus);

  const pickImage = async () => {
    // Demande la permission pour accéder à la galerie
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission d\'accès à la galerie requise.');
      return;
    }

    // Ouvre la galerie
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Demande la permission pour accéder à la caméra
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission d\'accès à la caméra requise.');
      return;
    }

    // Ouvre la caméra
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSaveImage = () => {
    if (selectedImage == "" || selectedImage == null) {
      showToast("error", i18n.t('toastStatus.error'), i18n.t('addImg.error.imgMissing'));
      router.back();
      return;
    }
    if (text == "" || text == null) {
      showToast("error", i18n.t('toastStatus.error'), i18n.t('addImg.error.nameMissing'));
      router.back();
      return;
    }

    const treatmentPlaceId = uuid as string;

    dispatch(uploadFile({ file: selectedImage, treatmentPlaceId }))
    router.back();
  };

  useEffect(() => {
    if (fileUploadStatus === "succeeded") {
      showToast("success", i18n.t('toastStatus.success'), i18n.t('addImg.toast.success'));
    } else if (fileUploadStatus === "failed") {
      showToast("error", i18n.t('toastStatus.error'), i18n.t('addImg.toast.error'));
    }
  }, [fileUploadStatus]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <ReturnButton />
        <View style={styles.formContainer}>
          <ThemedText style={styles.titleModal}>{i18n.t('addImg.title')}</ThemedText>
          <View>
            <View style={styles.labelContainer}>
              <ThemedText style={styles.label}>{i18n.t('addImg.nameInput')}</ThemedText>
            </View>
            <TextInput
              style={[styles.input, { height: inputHeight }]}
              placeholder={i18n.t('addImg.nameInput')}
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
            {selectedImage && <Image source={{ uri: selectedImage }} style={styles.image}/>}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.chooseButton, styles.cameraButton]} onPress={takePhoto}>
                <MaterialCommunityIcons name="camera" size={24} color="white" style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>{i18n.t('addImg.cameraBtn') || 'Caméra'}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chooseButton, styles.galleryButton]} onPress={pickImage}>
                <MaterialCommunityIcons name="image" size={24} color="white" style={styles.buttonIcon} />
                <ThemedText style={styles.buttonText}>{i18n.t('addImg.chooseBtn')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.button} onPress={handleSaveImage}>
              <ThemedText>{i18n.t('addImg.addBtn')}</ThemedText>
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
  buttonContainer: {
    flexDirection: "row" as "row",
    justifyContent: "center" as "center",
    gap: 15,
    marginTop: height * 0.02,
  },
  cameraButton: {
    flex: 1,
    maxWidth: width * 0.35,
  },
  galleryButton: {
    flex: 1,
    maxWidth: width * 0.35,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14,
  }
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
