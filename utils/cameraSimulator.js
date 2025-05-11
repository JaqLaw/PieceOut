// Utility to simulate barcode scanning in iOS simulator
// Improved version with reliable return value

// Mock barcode data
export const mockBarcodes = [
  { data: "9780747532743", type: "EAN13" }, // Harry Potter puzzle example
  { data: "0673419319881", type: "EAN13" }, // LEGO puzzle example
  { data: "4005556150267", type: "EAN13" }, // Ravensburger puzzle example
];

// Get a random barcode from our mock set
export const getRandomBarcode = () => {
  const randomIndex = Math.floor(Math.random() * mockBarcodes.length);
  return mockBarcodes[randomIndex];
};

// Simulate a barcode scan with callback
export const simulateBarcodeScan = (callback) => {
  try {
    // Simulate a delay like a real scan would have
    setTimeout(() => {
      // Get a random barcode
      const mockBarcode = getRandomBarcode();

      // Alert for debugging
      console.log(`Simulator selecting barcode: ${mockBarcode.data}`);

      // Execute the callback with our mock data
      if (typeof callback === "function") {
        callback({
          type: mockBarcode.type,
          data: mockBarcode.data,
        });
      } else {
        console.error("Barcode callback is not a function:", callback);
      }
    }, 1500); // 1.5 second delay to simulate camera scanning
  } catch (error) {
    console.error("Error in simulateBarcodeScan:", error);
  }
};
