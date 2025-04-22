import * as Font from "expo-font";

export const loadFonts = async () => {
  try {
    // Define the font file path
    const soraFontPath = require("../assets/fonts/Sora-VariableFont_wght.ttf");

    // Load only the base font name - this will work for all font styles
    // when referenced in your app
    await Font.loadAsync({
      Sora: soraFontPath,
    });

    console.log("Font loaded successfully");
  } catch (error) {
    console.error("Error in loadFonts:", error);
    throw error;
  }
};
