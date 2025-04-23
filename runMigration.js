// filepath: /Users/jaq/PieceOut/runMigration.js
import realm from "./realm";

console.log("Starting manual database migration process...");

// Get current schema version
try {
  const path = realm.path;
  const currentVersion = Realm.schemaVersion(path);
  console.log(`Database path: ${path}`);
  console.log(`Current schema version: ${currentVersion}`);
  console.log(`Target schema version: 4`);

  if (currentVersion < 4) {
    console.log("Schema needs to be updated. Running migration...");

    // Force migration by closing and reopening the realm
    realm.close();

    // Re-open the realm to trigger migration
    const migratedRealm = new Realm({
      path: path,
      schema: [PuzzleItem, TimeRecord],
      schemaVersion: 4,
      migration: migrationFunction, // Using the existing migration function from realm.js
    });

    // Print some information about the migrated database
    const puzzles = migratedRealm.objects("PuzzleItem");
    console.log(`Total puzzles after migration: ${puzzles.length}`);

    // Check if new fields were populated
    let puzzlesWithCreatedAt = 0;
    let puzzlesWithLastCompleted = 0;

    puzzles.forEach((puzzle) => {
      if (puzzle.createdAt) puzzlesWithCreatedAt++;
      if (puzzle.lastCompletedAt) puzzlesWithLastCompleted++;
    });

    console.log(
      `Puzzles with createdAt date: ${puzzlesWithCreatedAt}/${puzzles.length}`
    );
    console.log(
      `Puzzles with lastCompletedAt date: ${puzzlesWithLastCompleted}/${puzzles.length}`
    );

    // Close the migrated realm
    migratedRealm.close();

    console.log("Migration completed successfully!");
  } else {
    console.log(
      "Schema is already at the current version. No migration needed."
    );
    realm.close();
  }

  console.log("Migration process finished. You can now restart your app.");
  process.exit(0);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
