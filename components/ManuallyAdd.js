import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import realm from "../realm";

// Import the placeholder image directly
import placeholderImage from "../assets/images/placeholder.png";

function ManuallyAdd({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [pieces, setPieces] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState(null);

  // Function to request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera access is required to take photos. Please enable it in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              // Open device settings so user can enable permissions manually
              Platform.OS === "ios"
                ? Linking.openURL("app-settings:")
                : Linking.openSettings();
            },
          },
        ]
      );
      return false;
    }
    return true;
  };

  // Function to request media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Photo library access is required to select images. Please enable it in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              // Open device settings so user can enable permissions manually
              Platform.OS === "ios"
                ? Linking.openURL("app-settings:")
                : Linking.openSettings();
            },
          },
        ]
      );
      return false;
    }
    return true;
  };

  // Create a unique filename for the image based on timestamp and random number
  const generateUniqueFileName = () => {
    return `puzzle_image_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
  };

  // Save image to app's permanent storage
  const saveImageToAppStorage = async (uri) => {
    try {
      // Define the directory for storing puzzle images
      const appImagesDir = `${FileSystem.documentDirectory}puzzle_images/`;

      // Check if directory exists, if not create it
      const dirInfo = await FileSystem.getInfoAsync(appImagesDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(appImagesDir, {
          intermediates: true,
        });
      }

      // Generate a unique filename
      const fileName = generateUniqueFileName();
      const newUri = `${appImagesDir}${fileName}`;

      // Copy the image to app storage
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      console.log("Image saved to app storage:", newUri);
      return newUri;
    } catch (error) {
      console.error("Error saving image to app storage:", error);
      Alert.alert("Error", "Failed to save image. Please try again.");
      return null;
    }
  };

  const pickImage = async () => {
    // Request permission to access the media library
    const permissionGranted = await requestMediaLibraryPermission();
    if (!permissionGranted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Reduced quality for better performance
    });

    if (!result.canceled) {
      // Delete previous image if one was already selected
      if (imageUri) {
        await deleteImageFromAppStorage(imageUri);
      }

      const originalUri = result.assets[0].uri;
      // Save image to app storage
      const permanentUri = await saveImageToAppStorage(originalUri);
      if (permanentUri) {
        setImageUri(permanentUri);
        console.log("Gallery image saved permanently:", permanentUri);
      }
    }
  };

  const takePhoto = async () => {
    // Request permission to access the camera
    const permissionGranted = await requestCameraPermission();
    if (!permissionGranted) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Reduced quality for better performance
    });

    if (!result.canceled) {
      // Delete previous image if one was already selected
      if (imageUri) {
        await deleteImageFromAppStorage(imageUri);
      }

      const originalUri = result.assets[0].uri;
      // Save image to app storage
      const permanentUri = await saveImageToAppStorage(originalUri);
      if (permanentUri) {
        setImageUri(permanentUri);
        console.log("Camera photo saved permanently:", permanentUri);
      }
    }
  };

  const savePuzzleItem = () => {
    try {
      // Validate that at least a name is provided
      if (!name.trim()) {
        alert("Please enter a name for the puzzle");
        return;
      }

      // Create puzzle object with all fields properly formatted
      const puzzleToCreate = {
        id: realm.objects("PuzzleItem").length + 1,
        name: name.trim(),
        brand: brand ? brand.trim() : "",
        notes: notes ? notes.trim() : "",
        imageUri: imageUri || null,
      };

      // Handle numeric fields with default values to avoid null
      puzzleToCreate.pieces = pieces ? parseInt(pieces) : 0;
      // Best time will be calculated automatically from time records
      puzzleToCreate.bestTimeHours = 0;
      puzzleToCreate.bestTimeMinutes = 0;
      puzzleToCreate.bestTimeSeconds = 0;

      realm.write(() => {
        realm.create("PuzzleItem", puzzleToCreate);
      });

      console.log("Puzzle saved successfully");
      navigation.navigate("Home");
    } catch (error) {
      console.error("Error saving puzzle:", error);

      // Provide more specific error messages based on the error
      let errorMessage = "Error saving puzzle: ";

      if (error.message.includes("number or bigint")) {
        errorMessage +=
          "A numeric field (pieces, hours, minutes, or seconds) requires a valid number. Using 0 for empty fields.";
      } else if (error.message.includes("string")) {
        errorMessage +=
          "Text fields need to be valid text. Please check name, brand, and notes.";
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Manually Add Puzzle Item</Text>

      {/* Display image at the top */}
      <View style={styles.imageContainer}>
        <Image
          source={
            imageUri
              ? { uri: imageUri }
              : require("../assets/images/placeholder.png")
          }
          style={styles.thumbnailImage}
          defaultSource={require("../assets/images/placeholder.png")}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Brand"
        value={brand}
        onChangeText={setBrand}
      />
      <TextInput
        style={styles.input}
        placeholder="Number of Pieces"
        value={pieces}
        onChangeText={setPieces}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
      />
      <View style={styles.buttonContainer}>
        <Button title="Pick an image from gallery" onPress={pickImage} />
        <Button title="Take a photo" onPress={takePhoto} />
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={savePuzzleItem}
      >
        <Text style={styles.buttonText}>Save Puzzle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.secondary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Back to Add Puzzles</Text>
      </TouchableOpacity>
    </View>
  );
}

export default ManuallyAdd;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F7F3",
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: "Sora",
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  input: {
    width: "80%",
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontFamily: "Sora",
  },
  buttonContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Sora",
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  timeContainer: {
    width: "80%",
    marginVertical: 10,
  },
  timeLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: "Sora",
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  timeInput: {
    width: 50,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    textAlign: "center",
    fontFamily: "Sora",
  },
  timeSeparator: {
    fontSize: 20,
    marginHorizontal: 5,
    fontFamily: "Sora",
  },
});
