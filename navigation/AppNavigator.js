import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import MapScreen from "../screens/MapScreen";
import ReportScreen from "../screens/ReportScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#121212" }, // dark header background
          headerTintColor: "#fff", // white text/icons
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#1E1E1E" }, // dark screen background
        }}
      >
        <Stack.Screen
          name="Ice Sightings"
          component={MapScreen}
          options={{ title: "Ice Sightings" }}
        />
        <Stack.Screen
          name="Report"
          component={ReportScreen}
          options={{ title: "Report Ice" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
