// Helper file for custom picker styling
import { Platform, StyleSheet } from "react-native";

// Platform-specific picker styling to ensure background fills entire width
export const getPickerItemStyle = () => {
  if (Platform.OS === "ios") {
    return {
      fontFamily: "Sora",
      fontSize: 16,
      backgroundColor: "#f9f0fc", // Match container background
      color: "#333",
      width: "120%", // Extend beyond container width to fill edges
      marginLeft: -10, // Push left edge outside container
      marginRight: -10, // Push right edge outside container
      textAlign: "center", // Center the text
      paddingLeft: 20, // Compensate for negative margins to keep text centered
      paddingRight: 20, // Compensate for negative margins to keep text centered
    };
  } else {
    // Android styling
    return {
      fontFamily: "Sora",
      fontSize: 16,
      color: "#333",
      backgroundColor: "#f9f0fc", // Match container background
      textAlign: "center", // Center the text
      width: "100%",
    };
  }
};

// For future use with react-native-picker-select if needed
export const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    color: "#333",
    fontFamily: "Sora",
    backgroundColor: "#f9f0fc",
    width: "100%",
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    color: "#333",
    fontFamily: "Sora",
    backgroundColor: "#f9f0fc",
    width: "100%",
  },
});
