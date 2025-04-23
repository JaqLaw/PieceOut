import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  AppState,
  TextInput,
  Platform,
} from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import logo from "./assets/images/logo.jpeg";
import titleImage from "./assets/images/title.jpeg";
import realm from "./realm";
import * as SplashScreen from "expo-splash-screen";
import { loadFonts } from "./utils/fontLoader";
import { Picker } from "@react-native-picker/picker";
import { getPickerItemStyle } from "./utils/pickerStyle";

import AddPuzzles from "./components/AddPuzzles";
import Scan from "./components/Scan";
import Search from "./components/Search";
import ManuallyAdd from "./components/ManuallyAdd";
import EditPuzzle from "./components/EditPuzzle";
import Timer from "./components/Timer";
import Settings from "./components/Settings";

const Stack = createStackNavigator();
const AddPuzzlesStack = createStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#b76cc3",
    secondary: "#763aab",
  },
  fonts: {
    regular: "Sora",
    medium: "Sora-Medium",
    light: "Sora-Light",
    thin: "Sora-Light",
    bold: "Sora-Bold",
  },
};

function HomeScreen({ navigation }) {
  const [puzzleItems, setPuzzleItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pieceFilter, setPieceFilter] = useState(null);
  const [brandFilter, setBrandFilter] = useState(null);
  const [sortOption, setSortOption] = useState("piecesLowToHigh"); // Default sort
  const [pieceOptions, setPieceOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Refresh puzzle items whenever the screen comes into focus
  useEffect(() => {
    const refreshPuzzles = () => {
      const items = realm.objects("PuzzleItem");
      setPuzzleItems(Array.from(items)); // Convert to regular array to force refresh

      // Extract unique piece counts and brands for filters
      const uniquePieces = new Set();
      const uniqueBrands = new Set();

      items.forEach((item) => {
        if (item.pieces) uniquePieces.add(item.pieces);
        if (item.brand) uniqueBrands.add(item.brand);
      });

      setPieceOptions(Array.from(uniquePieces).sort((a, b) => a - b));
      setBrandOptions(Array.from(uniqueBrands).sort());
    };

    // Refresh immediately
    refreshPuzzles();

    // Add listener for when screen comes into focus
    const unsubscribe = navigation.addListener("focus", refreshPuzzles);

    // Clean up listener on unmount
    return unsubscribe;
  }, [navigation]);

  // Filter and sort puzzles based on current filters and sort option
  const getFilteredAndSortedPuzzles = () => {
    let filteredItems = [...puzzleItems];

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.brand && item.brand.toLowerCase().includes(query)) ||
          (item.notes && item.notes.toLowerCase().includes(query))
      );
    }

    // Apply piece filter
    if (pieceFilter && pieceFilter !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.pieces === Number(pieceFilter)
      );
    }

    // Apply brand filter
    if (brandFilter && brandFilter !== "all") {
      filteredItems = filteredItems.filter(
        (item) => item.brand === brandFilter
      );
    } // Apply sorting
    switch (sortOption) {
      case "piecesLowToHigh":
        filteredItems.sort((a, b) => {
          // Primary sort by pieces
          const piecesA = a.pieces || 0;
          const piecesB = b.pieces || 0;
          if (piecesA !== piecesB) return piecesA - piecesB;

          // Secondary sort by title alphabetically
          return a.name.localeCompare(b.name);
        });
        break;
      case "piecesHighToLow":
        filteredItems.sort((a, b) => {
          const piecesA = a.pieces || 0;
          const piecesB = b.pieces || 0;
          if (piecesA !== piecesB) return piecesB - piecesA;
          return a.name.localeCompare(b.name);
        });
        break;
      case "nameAToZ":
        filteredItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nameZToA":
        filteredItems.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "dateAddedDesc":
        filteredItems.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        break;
      case "dateAddedAsc":
        filteredItems.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB; // Oldest first
        });
        break;
      case "lastCompletedDesc":
        filteredItems.sort((a, b) => {
          const dateA = a.lastCompletedAt
            ? new Date(a.lastCompletedAt).getTime()
            : 0;
          const dateB = b.lastCompletedAt
            ? new Date(b.lastCompletedAt).getTime()
            : 0;
          return dateB - dateA; // Newest first
        });
        break;
      case "lastCompletedAsc":
        filteredItems.sort((a, b) => {
          const dateA = a.lastCompletedAt
            ? new Date(a.lastCompletedAt).getTime()
            : 0;
          const dateB = b.lastCompletedAt
            ? new Date(b.lastCompletedAt).getTime()
            : 0;
          return dateA - dateB; // Oldest first
        });
        break;
      default:
        // Default is already piecesLowToHigh
        break;
    }

    return filteredItems;
  };

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

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search puzzles by name, brand, or notes"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="always"
        />
      </View>

      {/* Filters and Sort Controls Toggle */}
      <View style={styles.filterToggleContainer}>
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>
            {showFilters ? "Hide Filters & Sort" : "Show Filters & Sort"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters and Sort Controls */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Piece Count Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Pieces:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={pieceFilter}
                style={styles.picker}
                onValueChange={(value) => setPieceFilter(value)}
                itemStyle={getPickerItemStyle()}
              >
                <Picker.Item
                  label="All Piece Counts"
                  value="all"
                  style={getPickerItemStyle()}
                />
                {pieceOptions.map((pieces) => (
                  <Picker.Item
                    key={pieces}
                    label={pieces.toString()}
                    value={pieces}
                    style={getPickerItemStyle()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Brand Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Brand:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={brandFilter}
                style={styles.picker}
                onValueChange={(value) => setBrandFilter(value)}
                itemStyle={getPickerItemStyle()}
              >
                <Picker.Item
                  label="All Brands"
                  value="all"
                  style={getPickerItemStyle()}
                />
                {brandOptions.map((brand) => (
                  <Picker.Item
                    key={brand}
                    label={brand}
                    value={brand}
                    style={getPickerItemStyle()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sortOption}
                style={styles.picker}
                onValueChange={(value) => setSortOption(value)}
                itemStyle={getPickerItemStyle()}
              >
                <Picker.Item
                  label="Pieces: Low to High"
                  value="piecesLowToHigh"
                  style={getPickerItemStyle()}
                />
                <Picker.Item
                  label="Pieces: High to Low"
                  value="piecesHighToLow"
                  style={getPickerItemStyle()}
                />
                <Picker.Item
                  label="Name: A to Z"
                  value="nameAToZ"
                  style={getPickerItemStyle()}
                />
                <Picker.Item
                  label="Name: Z to A"
                  value="nameZToA"
                  style={getPickerItemStyle()}
                />
                <Picker.Item
                  label="Date Added: Newest First"
                  value="dateAddedDesc"
                  style={getPickerItemStyle()}
                />
                <Picker.Item
                  label="Date Added: Oldest First"
                  value="dateAddedAsc"
                  style={getPickerItemStyle()}
                />
                <Picker.Item
                  label="Last Completed: Newest First"
                  value="lastCompletedDesc"
                  style={getPickerItemStyle()}
                />
                <Picker.Item
                  label="Last Completed: Oldest First"
                  value="lastCompletedAsc"
                  style={getPickerItemStyle()}
                />
              </Picker>
            </View>
          </View>

          {/* Clear Filters Button */}
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSearchQuery("");
              setPieceFilter(null);
              setBrandFilter(null);
              setSortOption("piecesLowToHigh");
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: MyTheme.colors.primary }]}
          onPress={() => navigation.navigate("Add Puzzles")}
        >
          <Text style={styles.buttonText}>Add Puzzle</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={getFilteredAndSortedPuzzles()}
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
        <Stack.Screen name="Settings" component={Settings} />
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
    fontFamily: "Sora", // Set default font for the app container
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
  searchContainer: {
    marginVertical: 10,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    fontFamily: "Sora",
  },
  filterToggleContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  filterToggleButton: {
    padding: 10,
    backgroundColor: "#dbb3e3",
    borderRadius: 5,
    width: "70%",
    alignItems: "center",
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a2356",
    fontFamily: "Sora-Bold",
  },
  filtersContainer: {
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  filterSection: {
    marginVertical: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#4a2356",
    fontFamily: "Sora-Medium",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f9f0fc",
    marginTop: 2,
    height: 40,
    marginBottom: 15, // Space between pickers
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    backgroundColor: "#f9f0fc",
    color: "#333",
    marginTop: -90, // Align text in the center of container
    height: 40,
    fontFamily: "Sora", // Add consistent font family
    fontSize: 16, // Match font size with labels
    textAlign: "center", // Add text alignment to the base picker
    alignItems: "center", // Center items horizontally
  },
  clearFiltersButton: {
    marginTop: 15,
    backgroundColor: "#ff6666",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  clearFiltersText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Sora-Bold",
    fontSize: 15,
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
