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
import { Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function MapScreen({ navigation }) {
  const [sightings, setSightings] = useState([]);
  const [region, setRegion] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const mapRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchSightings();
    }, [])
  );

  useEffect(() => {
    goToMe();
  }, []);

  const getPinColor = (timestamp) => {
    const hoursAgo = (new Date() - new Date(timestamp)) / 1000 / 60 / 60;
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

  const goToMe = async () => {
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
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const goToSighting = (s) => {
    mapRef.current?.animateToRegion(
      {
        latitude: s.lat,
        longitude: s.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
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
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="You are here"
            pinColor="#4FC3F7"
          />
          {sightings.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
              pinColor={getPinColor(s.timestamp)}
              onCalloutPress={() =>
                s.image_url && setSelectedImage(s.image_url)
              }
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

      {/* Top Right Buttons */}
      <View style={styles.topRightButtons}>
        {/* Info */}
        <TouchableOpacity
          style={styles.iconButton}
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

        {/* Refresh */}
        <TouchableOpacity style={styles.iconButton} onPress={fetchSightings}>
          <Ionicons name="refresh" size={22} color="#FFF" />
        </TouchableOpacity>

        {/* Go To Me */}
        <TouchableOpacity style={styles.iconButton} onPress={goToMe}>
          <Ionicons name="locate" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

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

      {/* Bottom Report Ice Button */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => navigation.navigate("Report")}
      >
        <Text style={styles.buttonText}>Report Ice</Text>
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
  reportButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 18,
    borderRadius: 50,
    backgroundColor: "#2962FF",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "bold" },
  topRightButtons: {
    position: "absolute",
    top: 15,
    right: 15,
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
