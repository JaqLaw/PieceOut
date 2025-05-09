import * as Font from "expo-font";

export const loadFonts = async () => {
  try {
    // Define the font file paths
    const soraFontPath = require("../assets/fonts/Sora-VariableFont_wght.ttf");
    const juraFontPath = require("../assets/fonts/Jura-VariableFont_wght.ttf");

    // Load fonts with variant styles
    await Font.loadAsync({
      // Base Sora font
      Sora: soraFontPath,
      "Sora-Light": soraFontPath,
      "Sora-Medium": soraFontPath,
      "Sora-Bold": soraFontPath,

      // Base Jura font
      Jura: juraFontPath,
      "Jura-Light": juraFontPath,
      "Jura-Medium": juraFontPath,
      "Jura-Bold": juraFontPath,
    });
  } catch (error) {
    console.error("Error in loadFonts:", error);
    throw error;
  }
};
