import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";

function AddPuzzles({ navigation }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Puzzles</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Scan")}
        >
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Search")}
        >
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Manually Add")}
        >
          <Text style={styles.buttonText}>Manually Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.spacer} />
      <View style={styles.homeButtonContainer}>
        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default AddPuzzles;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F7F3",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 50,
    fontFamily: "Sora-Bold",
  },
  buttonContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  homeButtonContainer: {
    marginVertical: 25,
    alignItems: "center",
    paddingBottom: 10,
  },
  spacer: {
    flex: 1, // Reduced from 1 to bring the button up
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  homeButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: 200,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Sora",
  },
  homeButtonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Sora",
  },
});
