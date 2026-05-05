import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../components/ThemeContext";

export default function HomeScreen() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "light" ? "#fff" : "#0f1115" },
      ]}
    >
      <Text
        style={[styles.title, { color: theme === "light" ? "#000" : "#fff" }]}
      >
        Домашняя страница
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "600" },
});
