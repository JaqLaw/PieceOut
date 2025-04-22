import * as Font from "expo-font";

export const loadFonts = async () => {
  try {
    // Define the font file path
    const soraFontPath = require("../assets/fonts/Sora-VariableFont_wght.ttf");

    // Load the font with Font.loadAsync
    await Font.loadAsync({
      Sora: soraFontPath,
      "Sora-Regular": soraFontPath,
      "Sora-Light": soraFontPath,
      "Sora-Medium": soraFontPath,
      "Sora-Bold": soraFontPath,
    });
  } catch (error) {
    console.error("Error in loadFonts:", error);
    throw error;
  }
};
