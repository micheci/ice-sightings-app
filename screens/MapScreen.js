import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function MapScreen({ navigation }) {
  const [sightings, setSightings] = useState([]);
  const [region, setRegion] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchSightings();
    getCurrentLocation();
  }, []);

  const fetchSightings = async () => {
    try {
      const res = await axios.get(`${API_URL}/sightings`);
      setSightings(res.data.sightings);
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
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
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Ice Sightings</Text>

      {region && (
        <MapView
          ref={mapRef}
          style={{ height: SCREEN_HEIGHT * 0.5, width: "100%" }}
          region={region}
        >
          {/* User location marker */}
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="You are here"
            pinColor="blue"
          />

          {/* Sightings markers */}
          {sightings.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
            >
              <Callout>
                <View style={{ width: 150 }}>
                  <Text>{s.description}</Text>
                  {s.image_url && (
                    <Image
                      source={{ uri: s.image_url }}
                      style={{ width: 100, height: 100, marginTop: 5 }}
                    />
                  )}
                  <Text style={{ fontSize: 10, color: "#555" }}>
                    {new Date(s.timestamp).toLocaleString()}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      <View style={{ flex: 1, padding: 20 }}>
        <FlatList
          data={sightings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sightingItem}
              onPress={() => goToSighting(item)}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
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
          { bottom: 100, right: 20, backgroundColor: "#4CAF50" },
        ]}
        onPress={getCurrentLocation}
      >
        <Text style={styles.buttonText}>Refresh Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 10,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  button: {
    position: "absolute",
    padding: 15,
    borderRadius: 50,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
  sightingItem: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
});
