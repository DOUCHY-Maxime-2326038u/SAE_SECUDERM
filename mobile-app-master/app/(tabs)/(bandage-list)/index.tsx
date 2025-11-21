import { Button, Dimensions, FlatList, StyleSheet, View, TouchableOpacity, TextInput } from "react-native";
import BandageButton from "@/components/BandageButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {resetAuthStatus, selectIsAuthenticated, selectStatus, selectUserAuth} from "@/store/auth";
import { ThemedText } from "@/components/ThemedText";
import { useIsFocused } from "@react-navigation/core";
import { useEffect, useState } from "react";
import { Type } from "@/store/enums";
import i18n from '@/languages/language-config';
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { selectTreatmentPlaceFetchStatus, selectTreatmentPlaces } from "@/store/treatmentPlace";
import { fetchTreatmentPlacesByClientId, fetchTreatmentPlacesByDoctorId } from "@/store/treatmentPlaceThunks";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

/**
 * Screen component for displaying a list of bandages.
 * Fetches and displays treatment places based on the authenticated user's type (doctor or client).
 * Provides a button to refresh the list and a help button to navigate to the tutorial.
 */
// Get the window dimensions (width and height) for responsive design
const { width, height } = Dimensions.get('window');

export default function BandageListScreen() {
  const dispatch = useAppDispatch();
  const treatmentPlaces = useAppSelector(selectTreatmentPlaces);
  const treatmentPlacesFetchStatus = useAppSelector(selectTreatmentPlaceFetchStatus);
  const user = useAppSelector(selectUserAuth);
  const userIsAuth = useAppSelector(selectIsAuthenticated);
  const isFocused = useIsFocused(); // Check if the screen is focused (visible)
  const authStatus = useAppSelector(selectStatus)
  const colorScheme = useColorScheme();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isFocused) {
      // If the user is authenticated, fetch treatment places based on user type (doctor or client)
      if (userIsAuth && user !== null && user?.id !== undefined) {
        handleFetchTreatmentPlaces();
      }
    }
  }, [isFocused]);

  useEffect(() => {
    if (authStatus === 'failed') {
      dispatch(resetAuthStatus());
      router.replace('/login'); // Redirect to log in screen if authentication fails
    } else if (authStatus === 'succeeded') {
      handleFetchTreatmentPlaces();
    }
  }, [authStatus]);

  // Function to fetch treatment places based on the user's type (Doctor or Client)
  const handleFetchTreatmentPlaces = () => {
    if (user !== null && user?.id !== undefined) {
      if (user.type === Type.DOCTOR) {
        dispatch(fetchTreatmentPlacesByDoctorId(user.id)); // Fetch by doctor ID
        return;
      }
      dispatch(fetchTreatmentPlacesByClientId(user.id)); // Fetch by client ID
      // Log success when fetching treatment places
      if (treatmentPlacesFetchStatus === 'succeeded') {
        console.log('Treatment Places fetched');
      }
    }
  };

  // Function to render each treatment place as a button
  const renderItem = ({ item }: { item: { id: string; text: string } }) => (
    <BandageButton key={item.id} text={item.text} uuid={item.id} />
  );

  // Filter treatment places based on search query
  const filteredTreatmentPlaces = treatmentPlaces.filter((treatmentPlace) =>
    treatmentPlace.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#333333' : '#f5f5f5' }]}>
        <MaterialCommunityIcons name="magnify" size={24} color={colorScheme === 'dark' ? '#aaa' : '#666'} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
          placeholder={i18n.t("indexBandages.searchPlaceholder") || "Chercher un pansement..."}
          placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close" size={24} color={colorScheme === 'dark' ? '#aaa' : '#666'} />
          </TouchableOpacity>
        )}
      </View>

      {filteredTreatmentPlaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText>{searchQuery ? i18n.t("indexBandages.noBandagesFound") : i18n.t("indexBandages.noBandages")}</ThemedText>
          <Button title={i18n.t("indexBandages.refreshBtn")} onPress={handleFetchTreatmentPlaces} />
        </View>
      ) : (
        <FlatList
          data={filteredTreatmentPlaces.map((treatmentPlace) => ({ id: treatmentPlace.id, text: treatmentPlace.label }))}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
      <TouchableOpacity style={styles.helpButton} onPress={() => router.push('/(tabs)/(bandage-list)/TutoBandage')}>
        <MaterialCommunityIcons name="help-circle" size={width * 0.06} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    marginTop: height * 0.015,
    marginBottom: height * 0.015,
    borderRadius: 10,
    width: width * 0.9,
    height: height * 0.055,
  },
  searchIcon: {
    marginRight: width * 0.03,
  },
  searchInput: {
    flex: 1,
    fontSize: width * 0.04,
    paddingVertical: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.2,
  },
  listContent: {
    alignItems: "center",
    marginTop: width * 0.05,
  },
  helpButton: {
    position: 'absolute',
    bottom: height * 0.03,
    right: width * 0.05,
    backgroundColor: '#007AFF',
    borderRadius: width * 0.12,
    padding: width * 0.03,
  },
});
