import Realm from "realm";


class PuzzleItem extends Realm.Object {}
PuzzleItem.schema = {
  name: "PuzzleItem",
  properties: {
    id: "int",
    name: "string",
    brand: "string?",
    pieces: "int?",
    notes: "string?",
    imageUri: "string?",
    bestTimeHours: "int?",
    bestTimeMinutes: "int?",
    bestTimeSeconds: "int?",
  },
  primaryKey: "id",
};

// Check if we need to delete the existing Realm file to force a new schema
const deletePreviousRealm = true; // Set to false when you're ready to go to production

if (deletePreviousRealm) {
  try {
    // Get path to Realm file
    const path = Realm.defaultPath;
    console.log("Trying to delete Realm file at:", path);

    // Delete Realm file
    Realm.deleteFile({ path });
    console.log("Successfully deleted Realm file, will create fresh database");
  } catch (error) {
    console.error("Error deleting Realm file:", error);
  }
}

// Define the migration function
const migrationFunction = (oldRealm, newRealm) => {
  console.log("Running migration...");

  // Only migrate if there are PuzzleItem objects
  if (oldRealm.schema.length > 0) {
    const oldObjects = oldRealm.objects("PuzzleItem");
    const newObjects = newRealm.objects("PuzzleItem");

    // For each old object, make sure time fields are properly initialized
    for (let i = 0; i < oldObjects.length; i++) {
      const oldObject = oldObjects[i];
      const newObject = newObjects[i];

      // Initialize time fields with default values if they were null
      newObject.bestTimeHours = oldObject.bestTimeHours || 0;
      newObject.bestTimeMinutes = oldObject.bestTimeMinutes || 0;
      newObject.bestTimeSeconds = oldObject.bestTimeSeconds || 0;
    }
  }

  console.log("Migration completed");
};

// TimeRecord schema for storing puzzle completion times
class TimeRecord extends Realm.Object {}
TimeRecord.schema = {
  name: "TimeRecord",
  properties: {
    id: "int",
    puzzleId: "int",
    date: "date",
    timeInSeconds: "int",
    ppm: "float",
  },
  primaryKey: "id",
};

// Create the realm with migration
const realm = new Realm({
  schema: [PuzzleItem, TimeRecord],
  schemaVersion: 3, // Increment this when you change your schema
  migration: migrationFunction,
});

export default realm;
