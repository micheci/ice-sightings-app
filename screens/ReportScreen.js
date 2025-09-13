import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Image,
  Alert,
  Linking,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import axios from "axios";

// Grab API URL from environment
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ReportScreen({ navigation }) {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const getLocation = async () => {
    // Check current permission status
    const { status: currentStatus } =
      await Location.getForegroundPermissionsAsync();

    if (currentStatus === "granted") {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      return;
    }

    // Request permission if not already granted
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    } else if (status === "denied") {
      // Permission denied, show alert with "Go to Settings"
      Alert.alert(
        "Location Permission Needed",
        "Allow location access to submit ice sightings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:"); // iOS opens app settings
              } else {
                Linking.openSettings(); // Android opens app settings
              }
            },
          },
        ]
      );
    }
  };

  const submitSighting = async () => {
    if (!description || !image || !location) {
      Alert.alert(
        "Missing info",
        "Please provide description, image, and location."
      );
      return;
    }

    const formData = new FormData();
    formData.append("description", description);
    formData.append("lat", location.latitude);
    formData.append("lng", location.longitude);
    formData.append("deviceId", "Device123"); // temp device ID
    formData.append("image", {
      uri: image.uri,
      name: "ice.png",
      type: "image/png",
    });

    try {
      await axios.post(`${API_URL}/sightings`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Success", "Sighting submitted!");
      navigation.goBack();
    } catch (err) {
      console.error("Submit error:", err.message);
      Alert.alert("Error", "Failed to submit sighting.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <Button title="Pick Image" onPress={pickImage} />
      {image && (
        <Image
          source={{ uri: image.uri }}
          style={{ width: 200, height: 200, marginVertical: 10 }}
        />
      )}
      <Button title="Get Location" onPress={getLocation} />
      {location && <Button title="Submit Sighting" onPress={submitSighting} />}
    </View>
  );
}
