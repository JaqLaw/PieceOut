import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  SafeAreaView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";

function Search({ navigation }) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search UPC Database for puzzles by name
  const searchPuzzlesByName = async (name) => {
    try {
      // UPC Database API endpoint with name search
      const response = await axios.get(
        `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(
          name
        )}&match_mode=0&type=product`
      );

      // Check if we have items in the result
      if (
        !response.data ||
        !response.data.items ||
        response.data.items.length === 0
      ) {
        return [];
      }

      // Filter items that look like puzzles
      const puzzleKeywords = ["puzzle", "jigsaw", "pieces"];
      const puzzleItems = response.data.items.filter((item) => {
        // Check if any of the keywords appear in the title
        const title = (item.title || "").toLowerCase();
        return puzzleKeywords.some((keyword) => title.includes(keyword));
      });

      // Transform to our puzzle format
      return puzzleItems.map((item) => ({
        name: item.title,
        brand: item.brand || "",
        image: item.images?.length > 0 ? item.images[0] : null,
        pieceCount: extractPieceCountFromTitle(item.title),
        year: extractYearFromTitle(item.title),
        description: item.description || "",
        source: "UPC Database",
      }));
    } catch (error) {
      console.error("Error in UPC search:", error.message);
      return [];
    }
  };

  // Helper function to extract piece count from title
  const extractPieceCountFromTitle = (title) => {
    if (!title) return "";

    // Common patterns: "1000 piece", "1000-piece", "1000 pc"
    const pieceMatch = title.match(/(\d+)(?:\s*-?\s*)(piece|pc|pieces)/i);
    return pieceMatch ? pieceMatch[1] : "";
  };

  // Helper function to extract year from title
  const extractYearFromTitle = (title) => {
    if (!title) return "";

    // Look for a year pattern (4 digits, typically starting with 19 or 20)
    const yearMatch = title.match(/(19|20)\d{2}/);
    return yearMatch ? yearMatch[0] : "";
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Please enter a puzzle name to search");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await searchPuzzlesByName(searchQuery);
      setSearchResults(results || []);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search for puzzles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectPuzzle = (puzzle) => {
    navigation.navigate("ManuallyAdd", { puzzleInfo: puzzle });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Search Puzzles</Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter puzzle name"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery("")}
                >
                  <MaterialIcons name="clear" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              onPress={handleSearch}
            >
              <MaterialIcons name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `puzzle-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => selectPuzzle(item)}
                >
                  <Text style={styles.puzzleName}>{item.name}</Text>
                  <Text style={styles.puzzleDetails}>
                    {item.brand} • {item.pieceCount} pieces
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                hasSearched ? (
                  searchQuery.trim() ? (
                    <Text style={styles.emptyText}>No puzzles found</Text>
                  ) : (
                    <Text style={styles.emptyText}>
                      Enter a puzzle name to search
                    </Text>
                  )
                ) : null
              }
              style={styles.resultsList}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Back to Add Puzzles</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F3",
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "Sora",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "white",
    paddingRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 20,
    fontFamily: "Sora",
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    width: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  puzzleName: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Sora",
    color: "#333",
  },
  puzzleDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    fontFamily: "Sora",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#666",
    fontFamily: "Sora",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Sora",
  },
});
