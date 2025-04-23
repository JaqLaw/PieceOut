import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { performMigration } from "../utils/databaseMigration";

const Settings = () => {
  const navigation = useNavigation();
  const [migrationStatus, setMigrationStatus] = useState(null);

  const handleMigration = async () => {
    try {
      Alert.alert(
        "Confirm Database Migration",
        "Are you sure you want to run database migration? This will update your database structure without deleting your data.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Run Migration",
            onPress: async () => {
              // Show loading state
              setMigrationStatus("Running migration...");

              // Run the migration
              const result = performMigration();

              if (result.success) {
                setMigrationStatus("Migration completed successfully!");
                Alert.alert(
                  "Success",
                  "Database migration completed successfully. Please restart the app for changes to take effect."
                );
              } else {
                setMigrationStatus(`Migration failed: ${result.message}`);
                Alert.alert("Error", `Migration failed: ${result.message}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Migration error:", error);
      setMigrationStatus(`Error: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Management</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleMigration}>
          <Text style={styles.actionButtonText}>Run Database Migration</Text>
        </TouchableOpacity>

        {migrationStatus && (
          <Text style={styles.statusText}>Status: {migrationStatus}</Text>
        )}

        <Text style={styles.helperText}>
          Use this option when you've updated the app and need to migrate your
          database to the new schema without losing data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          PieceOut - Version 1.0{"\n"}A jigsaw puzzle tracking app
        </Text>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F3",
    padding: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a2356",
    fontFamily: "Sora-Bold",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#4a2356",
    fontFamily: "Sora-Medium",
  },
  actionButton: {
    backgroundColor: "#b76cc3",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Sora-Bold",
  },
  statusText: {
    marginVertical: 10,
    fontSize: 14,
    color: "#555",
    fontFamily: "Sora",
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
    fontFamily: "Sora-Light",
  },
  aboutText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    fontFamily: "Sora",
  },
  backButton: {
    backgroundColor: "#dbb3e3",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: 20,
  },
  backButtonText: {
    color: "#4a2356",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Sora-Bold",
  },
});

export default Settings;
