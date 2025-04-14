import React from "react";
import { StyleSheet, View, Text, Button } from "react-native";

function Search({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search Page</Text>
      <Button title="Back to Add Puzzles" onPress={() => navigation.goBack()} />
    </View>
  );
}

export default Search;

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
});
