import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Camera } from "expo-camera";
import { useTheme } from "@react-navigation/native";
import { searchPuzzleByBarcode } from "../utils/puzzleAPI";

// This is a completely new implementation that prioritizes
// touch handling and UI responsiveness in the simulator

function Scan({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  // More accurate simulator detection with safer property access
  // This will only detect the iOS simulator running on a Mac, not a real iPhone
  const { width, height } = Dimensions.get("window");

  // Check if we're running on a simulator by using Expo's Constants module
  // or by checking device characteristics in a safer way
  const isSimulator =
    Platform.OS === "ios" &&
    __DEV__ &&
    // Check for specific simulator dimensions or other characteristics
    // that wouldn't match a real iPhone
    ((width === 1024 && height === 768) || // iPad simulator
      // Safe check for simulator model name
      (Platform.constants &&
        typeof Platform.constants.model === "string" &&
        Platform.constants.model.toLowerCase().includes("simulator")));

  useEffect(() => {
    // Only request camera permissions if not in simulator
    if (!isSimulator) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      })();
    }
  }, [isSimulator]);

  // Handle a real barcode scan
  const handleBarCodeScanned = async ({ type, data }) => {
    // Make sure we're not already processing a scan
    if (scanned) return;

    setScanned(true);
    setIsLoading(true);

    // Always log the barcode result for debugging
    console.log(`Barcode detected - Type: ${type}, Data: ${data}`);

    try {
      // Look up the puzzle info
      const puzzleInfo = await searchPuzzleByBarcode(data);
      setIsLoading(false);

      if (puzzleInfo) {
        navigation.navigate("Manually Add", { puzzleInfo });
      } else {
        Alert.alert(
          "Puzzle Not Found",
          "We couldn't find information for this puzzle. Would you like to enter details manually?",
          [
            {
              text: "No",
              style: "cancel",
              onPress: () => setScanned(false),
            },
            {
              text: "Yes",
              onPress: () =>
                navigation.navigate("Manually Add", {
                  puzzleInfo: { barcode: data },
                }),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error during barcode lookup:", error);
      setIsLoading(false);
      Alert.alert(
        "Error",
        "Failed to fetch puzzle information. Please try again.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  };

  // Simple, direct navigation function
  const goToManualAdd = (puzzleInfo) => {
    navigation.navigate("Manually Add", { puzzleInfo });
  };

  // If we're on a simulator, show the simulator UI
  if (isSimulator) {
    return (
      <SafeAreaView style={styles.simulatorContainer}>
        <Text style={styles.simulatorTitle}>Simulator Mode</Text>
        <Text style={styles.simulatorDescription}>
          Camera not available in simulator.{"\n"}Choose a sample puzzle:
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.samplePuzzleButton}
          onPress={() =>
            goToManualAdd({
              name: "Harry Potter Hogwarts",
              brand: "Ravensburger",
              pieceCount: "1000",
              barcode: "9780747532743",
            })
          }
        >
          <Text style={styles.samplePuzzleText}>Harry Potter Puzzle</Text>
          <Text style={styles.samplePuzzleDetails}>1000 pieces</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.samplePuzzleButton}
          onPress={() =>
            goToManualAdd({
              name: "LEGO Star Wars",
              brand: "LEGO",
              pieceCount: "500",
              barcode: "0673419319881",
            })
          }
        >
          <Text style={styles.samplePuzzleText}>LEGO Star Wars Puzzle</Text>
          <Text style={styles.samplePuzzleDetails}>500 pieces</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Add Puzzles</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Handle permission states for real device
  if (hasPermission === null) {
    return (
      <Text style={styles.statusText}>Requesting camera permission...</Text>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>
          No access to camera. Please grant permission in your device settings.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Real device camera view
  return (
    <View style={styles.container}>
      <Camera
        style={styles.scanner}
        type={Camera.Constants.Type.back}
        barCodeScannerSettings={{
          barCodeTypes: [
            "qr",
            "upc-e",
            "upc-a",
            "ean13",
            "ean8",
            "code39",
            "code128",
          ],
        }}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        ratio="16:9"
      >
        <View style={styles.scannerFrame}>
          {/* Scanner frame to help user position the barcode */}
        </View>
      </Camera>

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Position barcode within frame</Text>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Searching for puzzle information...
          </Text>
        </View>
      )}

      {scanned && !isLoading && (
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.scanAgainText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* Cancel button as white X */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F3",
  },
  simulatorContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#F5F7F3",
  },
  simulatorTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
    fontFamily: "Sora",
  },
  simulatorDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "Sora",
    paddingHorizontal: 20,
  },
  samplePuzzleButton: {
    backgroundColor: "#3498db",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  samplePuzzleText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Sora",
  },
  samplePuzzleDetails: {
    color: "white",
    fontSize: 14,
    fontFamily: "Sora",
    marginTop: 5,
  },
  backButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    padding: 15,
    marginTop: 30,
    width: "80%",
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Sora",
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    margin: 30,
    fontFamily: "Sora",
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 50,
  },
  overlayText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 5,
    fontFamily: "Sora",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(245, 247, 243, 0.9)",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Sora",
  },
  scanAgainButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  scanAgainText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Sora",
  },
  cancelButton: {
    position: "absolute",
    top: 80,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
  },
});

export default Scan;
