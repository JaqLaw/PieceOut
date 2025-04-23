// filepath: /Users/jaq/PieceOut/utils/databaseMigration.js
import realm from "../realm";

/**
 * This utility function helps manage database migration.
 * It provides information about the current schema version
 * and allows forcing a migration by closing and reopening the Realm.
 */
export const performMigration = () => {
  try {
    console.log("Starting manual migration process...");

    // Get current schema version
    const currentVersion = realm.schemaVersion(Realm.defaultPath);
    console.log(`Current schema version: ${currentVersion}`);
    console.log(`Target schema version: ${realm.schema.version}`);

    // Close the realm to ensure any pending migrations complete
    realm.close();

    // Re-open realm to trigger migration
    const reopenedRealm = new Realm({
      schema: realm.schema,
      schemaVersion: 4,
      migration: (oldRealm, newRealm) => {
        console.log("Running manual migration...");

        // Initialize new fields on PuzzleItems
        if (oldRealm.schemaVersion < 4) {
          const oldObjects = oldRealm.objects("PuzzleItem");
          const newObjects = newRealm.objects("PuzzleItem");

          for (let i = 0; i < oldObjects.length; i++) {
            const newObject = newObjects[i];

            // Initialize date fields if they don't exist
            if (!newObject.createdAt) {
              newObject.createdAt = new Date();
            }

            if (!newObject.lastCompletedAt) {
              newObject.lastCompletedAt = null;
            }
          }

          // Update lastCompletedAt from TimeRecords if available
          try {
            if (newRealm.schema.some((s) => s.name === "TimeRecord")) {
              for (let i = 0; i < newObjects.length; i++) {
                const puzzleId = newObjects[i].id;
                const timeRecords = newRealm
                  .objects("TimeRecord")
                  .filtered("puzzleId == $0", puzzleId);

                if (timeRecords.length > 0) {
                  const latestRecord = Array.from(timeRecords).sort(
                    (a, b) => b.date.getTime() - a.date.getTime()
                  )[0];

                  if (latestRecord) {
                    newObjects[i].lastCompletedAt = latestRecord.date;
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error updating lastCompletedAt:", error);
          }
        }

        console.log("Manual migration completed.");
      },
    });

    // Close the reopened realm
    reopenedRealm.close();

    console.log("Manual migration process completed successfully");
    return { success: true, message: "Migration completed successfully" };
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, message: `Migration failed: ${error.message}` };
  }
};
