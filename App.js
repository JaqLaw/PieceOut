import { StyleSheet, View, Image, Text, TouchableOpacity } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import logo from "./assets/images/logo.jpeg";
import titleImage from "./assets/images/title.jpeg";

import AddPuzzles from "./components/AddPuzzles";
import Scan from "./components/Scan";
import Search from "./components/Search";
import ManuallyAdd from "./components/ManuallyAdd";

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
          <Text style={styles.buttonText}>Add Puzzles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
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
  },
});
