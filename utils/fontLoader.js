import * as Font from "expo-font";
import { MaterialIcons } from "@expo/vector-icons";

export const loadFonts = async () => {
  try {
    // Define the font file paths
    const soraFontPath = require("../assets/fonts/Sora-VariableFont_wght.ttf");

    // Load fonts with variant styles
    await Font.loadAsync({
      // Base Sora font
      Sora: soraFontPath,
      "Sora-Light": soraFontPath,
      "Sora-Medium": soraFontPath,
      "Sora-Bold": soraFontPath,

      // Preload MaterialIcons font
      ...MaterialIcons.font,
    });
  } catch (error) {
    console.error("Error in loadFonts:", error);
    throw error;
  }
};
