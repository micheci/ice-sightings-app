import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function MapScreen({ navigation }) {
  const [sightings, setSightings] = useState([]);
  const [region, setRegion] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const mapRef = useRef(null);

  // Fetch sightings whenever screen focuses
  useFocusEffect(
    React.useCallback(() => {
      fetchSightings();
    }, [])
  );

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getPinColor = (timestamp) => {
    const now = new Date();
    const sightingTime = new Date(timestamp);
    const hoursAgo = (now - sightingTime) / 1000 / 60 / 60;

    if (hoursAgo < 3) return "red";
    if (hoursAgo < 6) return "orange";
    if (hoursAgo < 12) return "yellow";
    return "blue";
  };

  const fetchSightings = async () => {
    try {
      const res = await axios.get(`${API_URL}/sightings`);
      setSightings(res.data.sightings || res.data);
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({});
    const newRegion = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);

    if (mapRef.current) mapRef.current.animateToRegion(newRegion, 500);
  };

  const goToSighting = (s) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: s.lat,
          longitude: s.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
    }
  };

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          ref={mapRef}
          style={{ height: SCREEN_HEIGHT * 0.5, width: "100%" }}
          region={region}
          mapType="standard"
        >
          {/* User location */}
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="You are here"
            pinColor="#4FC3F7"
          />

          {/* Sightings */}
          {sightings.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
              pinColor={getPinColor(s.timestamp)}
              onCalloutPress={() => {
                if (s.image_url) setSelectedImage(s.image_url);
              }}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutText}>{s.description}</Text>
                  {s.image_url && (
                    <Text style={styles.viewImageText}>View Image</Text>
                  )}
                  <Text style={styles.timestamp}>
                    {new Date(s.timestamp).toLocaleString()}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
      {/* Info Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 40,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#333",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() =>
          alert(
            "Marker colors:\n\n🔴 Red: Just reported\n🟠 Orange: Reported 3–6 hours ago\n🟡 Yellow: Reported 6–12 hours ago\n🔵 Blue: Older reports"
          )
        }
      >
        <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 18 }}>
          ?
        </Text>
      </TouchableOpacity>

      {/* Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPressOut={() => setSelectedImage(null)}
        >
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.modalImage} />
          )}
        </TouchableOpacity>
      </Modal>

      {/* Sightings List */}
      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Sightings List</Text>
        {sightings.length === 0 ? (
          <Text style={styles.noSightings}>
            No sightings near you. Report if you see any!
          </Text>
        ) : (
          <FlatList
            data={sightings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sightingItem}
                onPress={() => goToSighting(item)}
              >
                <Text style={styles.sightingText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={[styles.button, { bottom: 30, right: 20 }]}
        onPress={() => navigation.navigate("Report")}
      >
        <Text style={styles.buttonText}>Report Ice</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { bottom: 30, left: 20, backgroundColor: "#00C853" },
        ]}
        onPress={getCurrentLocation}
      >
        <Text style={styles.buttonText}>Go To Me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  callout: { width: 160 },
  calloutText: { color: "#141313ff", fontWeight: "bold" },
  viewImageText: {
    marginTop: 5,
    color: "#4FC3F7",
    textDecorationLine: "underline",
  },
  timestamp: { fontSize: 10, color: "#AAA", marginTop: 4 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 12,
  },
  listContainer: { flex: 1, padding: 20 },
  listHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  noSightings: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
    marginTop: 20,
  },
  sightingItem: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#1E1E1E",
  },
  sightingText: { color: "#FFF" },
  button: {
    position: "absolute",
    padding: 15,
    borderRadius: 50,
    backgroundColor: "#2962FF",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "bold" },
});
