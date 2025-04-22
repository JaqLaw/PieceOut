import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import logo from "./assets/images/logo.jpeg";
import titleImage from "./assets/images/title.jpeg";
import realm from "./realm";
import * as SplashScreen from "expo-splash-screen";
import { loadFonts } from "./utils/fontLoader";

import AddPuzzles from "./components/AddPuzzles";
import Scan from "./components/Scan";
import Search from "./components/Search";
import ManuallyAdd from "./components/ManuallyAdd";
import EditPuzzle from "./components/EditPuzzle";
import Timer from "./components/Timer";

const Stack = createStackNavigator();
const AddPuzzlesStack = createStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#b76cc3",
    secondary: "#763aab",
  },
};

function HomeScreen({ navigation }) {
  const [puzzleItems, setPuzzleItems] = useState([]);

  // Refresh puzzle items whenever the screen comes into focus
  useEffect(() => {
    const refreshPuzzles = () => {
      const items = realm.objects("PuzzleItem");
      setPuzzleItems(Array.from(items)); // Convert to regular array to force refresh
    };

    // Refresh immediately
    refreshPuzzles();

    // Add listener for when screen comes into focus
    const unsubscribe = navigation.addListener("focus", refreshPuzzles);

    // Clean up listener on unmount
    return unsubscribe;
  }, [navigation]);

  const deletePuzzleItem = (id) => {
    try {
      const itemToDelete = realm.objectForPrimaryKey("PuzzleItem", id);
      if (itemToDelete) {
        // Show confirmation dialog with the puzzle name
        Alert.alert(
          "Confirm Deletion",
          `Are you sure you want to delete "${itemToDelete.name}"?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              onPress: () => {
                realm.write(() => {
                  // First, delete all TimeRecords associated with this puzzle
                  const relatedTimeRecords = realm
                    .objects("TimeRecord")
                    .filtered("puzzleId == $0", id);

                  // Delete each time record
                  relatedTimeRecords.forEach((record) => {
                    realm.delete(record);
                  });

                  // Then delete the puzzle item itself
                  realm.delete(itemToDelete);

                  // Refresh the list after deletion
                  setPuzzleItems(realm.objects("PuzzleItem"));
                });
              },
              style: "destructive",
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <View style={styles.appContainer}>
      <View style={styles.headingContainer}>
        <Image source={logo} style={styles.image} />
        <Image source={titleImage} style={styles.titleImage} />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: MyTheme.colors.primary }]}
          onPress={() => navigation.navigate("Add Puzzles")}
        >
          <Text style={styles.buttonText}>Add Puzzle</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={puzzleItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.itemContainer}>
              <TouchableOpacity
                style={styles.puzzleTouchable}
                onPress={() =>
                  navigation.navigate("Timer", { puzzleId: item.id })
                }
              >
                <View style={styles.contentRow}>
                  <Image
                    source={
                      item.imageUri
                        ? { uri: item.imageUri }
                        : require("./assets/images/placeholder.png") // Add a placeholder image
                    }
                    style={styles.listImage}
                  />
                  <View style={styles.listTextContainer}>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listText}>{item.brand}</Text>
                    <Text style={styles.listText}>{item.pieces} pieces</Text>
                    <Text style={styles.listText}>Notes: {item.notes}</Text>
                    <Text style={styles.listText}>
                      Best Time:{" "}
                      {`${String(item.bestTimeHours || 0).padStart(
                        2,
                        "0"
                      )}:${String(item.bestTimeMinutes || 0).padStart(
                        2,
                        "0"
                      )}:${String(item.bestTimeSeconds || 0).padStart(2, "0")}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.buttonsColumn}>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: MyTheme.colors.primary },
                  ]}
                  onPress={() =>
                    navigation.navigate("Edit Puzzle", { puzzleId: item.id })
                  }
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePuzzleItem(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load fonts when component mounts
  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we load fonts
        await SplashScreen.preventAutoHideAsync();
        // Load the fonts
        await loadFonts();
      } catch (e) {
        console.warn("Error loading fonts:", e);
      } finally {
        // Set fonts as loaded and hide splash screen
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Add Puzzles" component={AddPuzzles} />
        <Stack.Screen name="Scan" component={Scan} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="Manually Add" component={ManuallyAdd} />
        <Stack.Screen name="Edit Puzzle" component={EditPuzzle} />
        <Stack.Screen name="Timer" component={Timer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F7F3",
    paddingTop: 40, // Add more padding at the top
  },
  headingContainer: {
    flexDirection: "row", // Arrange items in a row
    alignItems: "center",
    justifyContent: "center", // Center the items
    marginTop: 20,
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 0,
  },
  titleImage: {
    width: 240,
    height: 60,
  },
  buttonContainer: {
    marginVertical: 10,
    alignItems: "center",
    marginBottom: 20, // Add more space below the button
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Sora-Bold",
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  itemContainer: {
    flexDirection: "row", // Arrange image and text side by side
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  listImage: {
    width: 100,
    height: 75,
    borderRadius: 5,
    marginRight: 10,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold", // Make the item name bold
    marginBottom: 5,
    fontFamily: "Sora",
  },
  listText: {
    fontSize: 14,
    color: "#555",
    fontFamily: "Sora-Light",
  },
  puzzleTouchable: {
    flex: 1,
    flexDirection: "row",
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  buttonsColumn: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    justifyContent: "center",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#9e2424",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Sora-Bold",
  },
});
