import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Linking,
  StyleSheet,
  ActionSheetIOS,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ReportScreen({ navigation }) {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Auto-fetch location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Location Permission Needed",
            "Allow location access to submit sightings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Go to Settings",
                onPress: () => {
                  if (Platform.OS === "ios") Linking.openURL("app-settings:");
                  else Linking.openSettings();
                },
              },
            ]
          );
          setLoadingLocation(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.5,
      allowsEditing: true,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  // Take a new photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Needed",
        "Allow camera access to take a photo."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      allowsEditing: true,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  // Show menu to pick or take photo
  const handleAddPhoto = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Pick from Library", "Take Photo"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) await pickImage();
          if (buttonIndex === 2) await takePhoto();
        }
      );
    } else {
      Alert.alert(
        "Add Photo",
        "Choose an option",
        [
          { text: "Pick from Library", onPress: pickImage },
          { text: "Take Photo", onPress: takePhoto },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  // Submit the sighting
  const submitSighting = async () => {
    if (!description || !image || !location) {
      Alert.alert(
        "Missing Info",
        "Please provide description, image, and location."
      );
      return;
    }

    const formData = new FormData();
    formData.append("description", description);
    formData.append("lat", location.latitude);
    formData.append("lng", location.longitude);
    formData.append("deviceId", "Device123"); // Replace with real device ID
    formData.append("image", {
      uri: image.uri,
      name: "sighting.png",
      type: "image/png",
    });

    try {
      await axios.post(`${API_URL}/sightings`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Success", "Sighting submitted!");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to submit sighting.");
    }
  };

  // Refresh location manually
  const refreshLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to get location.");
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Report Sighting</Text>

        <TextInput
          placeholder="Description"
          placeholderTextColor="#ccc" // lighter gray for visibility
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          multiline
        />

        {/* Single Add Photo button */}
        <TouchableOpacity style={styles.button} onPress={handleAddPhoto}>
          <Text style={styles.buttonText}>
            {image ? "Change Photo" : "Add Photo"}
          </Text>
        </TouchableOpacity>

        {image && (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        )}

        {/* Location section */}
        {location ? (
          <View style={styles.locationPreview}>
            <Text style={{ marginBottom: 5, color: "#FFF" }}>
              Location ready ✅
            </Text>
            <MapView
              style={{ width: "100%", height: 150, borderRadius: 10 }}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker coordinate={location} />
            </MapView>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, loadingLocation && styles.disabledButton]}
            onPress={refreshLocation}
          >
            <Text style={styles.buttonText}>
              {loadingLocation ? "Fetching Location..." : "Use My Location"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!description || !image || !location) && styles.disabledButton,
          ]}
          onPress={submitSighting}
          disabled={!description || !image || !location}
        >
          <Text style={styles.submitButtonText}>Submit Sighting</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#121212" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    textAlignVertical: "top",
    minHeight: 80,
  },
  button: {
    backgroundColor: "#2962FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: { color: "#FFF", fontWeight: "bold", textAlign: "center" },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: "#333",
  },
  locationPreview: {
    alignItems: "center",
    marginBottom: 15,
    color: "#FFF",
  },
  locationText: {
    textAlign: "center",
    marginBottom: 5,
    fontWeight: "bold",
    color: "#FFF",
  },
  mapPreview: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  submitButton: {
    backgroundColor: "#00C853",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  disabledButton: { opacity: 0.6 },
});
