import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Alert,
  AppState,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import realm from "../realm";

function Timer({ route, navigation }) {
  const { colors } = useTheme();
  const { puzzleId } = route.params;
  const [puzzleItem, setPuzzleItem] = useState(null);
  const [timeRecords, setTimeRecords] = useState([]);

  // Stopwatch state
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // time in seconds
  const timerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const lastTimeRef = useRef({ time: 0, timestamp: Date.now() });

  // Manual time entry
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  useEffect(() => {
    // Fetch puzzle item
    const item = realm.objectForPrimaryKey("PuzzleItem", puzzleId);
    setPuzzleItem(item);

    // Fetch time records for this puzzle
    const records = realm
      .objects("TimeRecord")
      .filtered("puzzleId == $0", puzzleId);
    setTimeRecords(Array.from(records).sort((a, b) => b.date - a.date)); // Sort by date, newest first
  }, [puzzleId]);

  // Handle app state changes to keep timer running even when phone is locked
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isRunning
      ) {
        // App has come to the foreground and timer is running
        const now = Date.now();
        const elapsedSeconds = Math.floor(
          (now - lastTimeRef.current.timestamp) / 1000
        );

        // Update timer with elapsed time
        setTime((prevTime) => {
          const newTime = prevTime + elapsedSeconds;
          return newTime;
        });

        // Update last timestamp
        lastTimeRef.current = {
          time: lastTimeRef.current.time + elapsedSeconds,
          timestamp: now,
        };
      } else if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/) &&
        isRunning
      ) {
        // App is going to background but timer is running
        // Save current state for when we return
        lastTimeRef.current = {
          time: time,
          timestamp: Date.now(),
        };
      }

      // Update the appState reference
      appStateRef.current = nextAppState;
    });

    // Load saved timer state if any
    const loadSavedTimer = async () => {
      try {
        const savedTimerState = await AsyncStorage.getItem("timer_state");
        if (savedTimerState) {
          const {
            time: savedTime,
            puzzleId: savedPuzzleId,
            isRunning: wasRunning,
            timestamp,
          } = JSON.parse(savedTimerState);
          if (savedPuzzleId === puzzleId) {
            // If it was running when saved, calculate elapsed time
            if (wasRunning) {
              const now = Date.now();
              const elapsedSeconds = Math.floor((now - timestamp) / 1000);
              setTime(savedTime + elapsedSeconds);
              setIsRunning(true);

              lastTimeRef.current = {
                time: savedTime + elapsedSeconds,
                timestamp: now,
              };

              // Start timer again
              timerRef.current = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
              }, 1000);
            } else {
              // It was paused, just restore the saved time
              setTime(savedTime);
              setIsRunning(false);
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved timer:", error);
      }
    };

    loadSavedTimer();

    // Cleanup function
    return () => {
      subscription.remove();

      // Save timer state when unmounting, whether running or paused
      saveTimerState();

      // Clear interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [puzzleId]);

  // Save current timer state to AsyncStorage
  const saveTimerState = async () => {
    try {
      // Always save the timer state, whether running or paused
      await AsyncStorage.setItem(
        "timer_state",
        JSON.stringify({
          time,
          puzzleId,
          isRunning,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error saving timer state:", error);
    }
  };

  // Calculate formatted time string (HH:MM:SS) from seconds
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  // Calculate PPM (Pieces Per Minute)
  const calculatePPM = (timeInSeconds, pieces) => {
    if (!pieces || pieces <= 0 || !timeInSeconds || timeInSeconds <= 0)
      return "0.00";

    const timeInMinutes = timeInSeconds / 60;
    const ppm = pieces / timeInMinutes;
    return ppm.toFixed(2); // Two decimal places
  };

  // Start or pause stopwatch
  const toggleTimer = () => {
    if (isRunning) {
      // When pausing the timer
      clearInterval(timerRef.current);

      // Don't remove state, just update it with isRunning=false
      // This preserves the current time when paused
    } else {
      // When starting the timer
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);

      // Save timestamp when timer started
      lastTimeRef.current = {
        time: time,
        timestamp: Date.now(),
      };
    }

    // Update running state
    setIsRunning(!isRunning);

    // After state has been updated, save the timer state
    // We delay this slightly to ensure the isRunning state is updated first
    setTimeout(() => {
      saveTimerState();
    }, 0);
  };

  // Reset stopwatch
  const resetTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setTime(0);

    // Clear saved timer state
    AsyncStorage.removeItem("timer_state");
  };

  // Submit stopwatch time
  const submitStopwatchTime = () => {
    if (time <= 0) {
      Alert.alert("Error", "Timer must be running to submit a time");
      return;
    }

    saveTimeRecord(time);
    resetTimer();
  };

  // Submit manually entered time
  const submitManualTime = () => {
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    const secondsNum = parseInt(seconds) || 0;

    if (hoursNum === 0 && minutesNum === 0 && secondsNum === 0) {
      Alert.alert("Error", "Please enter a valid time");
      return;
    }

    const totalSeconds = hoursNum * 3600 + minutesNum * 60 + secondsNum;
    saveTimeRecord(totalSeconds);

    // Clear form
    setHours("");
    setMinutes("");
    setSeconds("");
  };

  // Save time record to database
  const saveTimeRecord = (timeInSeconds) => {
    try {
      if (!puzzleItem) {
        Alert.alert("Error", "Puzzle not found");
        return;
      }

      const pieces = puzzleItem.pieces || 0;
      const ppm = calculatePPM(timeInSeconds, pieces);

      realm.write(() => {
        // Create the time record
        realm.create("TimeRecord", {
          id: Math.floor(Date.now() + Math.random() * 1000), // Unique ID
          puzzleId: puzzleId,
          date: new Date(),
          timeInSeconds: timeInSeconds,
          ppm: parseFloat(ppm),
        });

        // Update the puzzle's lastCompletedAt date
        puzzleItem.lastCompletedAt = new Date();

        // Refresh time records
        const records = realm
          .objects("TimeRecord")
          .filtered("puzzleId == $0", puzzleId);
        setTimeRecords(Array.from(records).sort((a, b) => b.date - a.date));

        // Update best time from all time records
        updateBestTimeFromRecords(puzzleId);
      });

      Alert.alert("Success", "Time recorded successfully!");
    } catch (error) {
      console.error("Error saving time record:", error);
      Alert.alert("Error", "Failed to save time record");
    }
  };

  // Helper function to find the fastest time and update puzzle's best time
  const updateBestTimeFromRecords = (puzzleId) => {
    try {
      const puzzle = realm.objectForPrimaryKey("PuzzleItem", puzzleId);
      if (!puzzle) {
        console.log("Puzzle not found for updating best time");
        return;
      }

      // Get all time records for this puzzle
      const timeRecords = realm
        .objects("TimeRecord")
        .filtered("puzzleId == $0", puzzleId);

      if (timeRecords.length === 0) {
        // No time records, reset best time to 0
        if (realm.isInTransaction) {
          // Already in a write transaction, just update the values
          puzzle.bestTimeHours = 0;
          puzzle.bestTimeMinutes = 0;
          puzzle.bestTimeSeconds = 0;
        } else {
          // Not in a transaction, start a new one
          realm.write(() => {
            puzzle.bestTimeHours = 0;
            puzzle.bestTimeMinutes = 0;
            puzzle.bestTimeSeconds = 0;
          });
        }
        return;
      }

      // Find the fastest time (minimum timeInSeconds)
      let fastestTime = Number.MAX_SAFE_INTEGER;
      timeRecords.forEach((record) => {
        if (record.timeInSeconds < fastestTime) {
          fastestTime = record.timeInSeconds;
        }
      });

      // Update the puzzle with the fastest time
      if (realm.isInTransaction) {
        // Already in a write transaction, just update the values
        puzzle.bestTimeHours = Math.floor(fastestTime / 3600);
        puzzle.bestTimeMinutes = Math.floor((fastestTime % 3600) / 60);
        puzzle.bestTimeSeconds = fastestTime % 60;
      } else {
        // Not in a transaction, start a new one
        realm.write(() => {
          puzzle.bestTimeHours = Math.floor(fastestTime / 3600);
          puzzle.bestTimeMinutes = Math.floor((fastestTime % 3600) / 60);
          puzzle.bestTimeSeconds = fastestTime % 60;
        });
      }
    } catch (error) {
      console.error("Error updating best time:", error);
    }
  };

  // Delete time record
  const deleteTimeRecord = (recordId) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this time record?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              realm.write(() => {
                const recordToDelete = realm.objectForPrimaryKey(
                  "TimeRecord",
                  recordId
                );
                if (recordToDelete) {
                  realm.delete(recordToDelete);
                  // Refresh time records
                  const records = realm
                    .objects("TimeRecord")
                    .filtered("puzzleId == $0", puzzleId);
                  setTimeRecords(
                    Array.from(records).sort((a, b) => b.date - a.date)
                  );

                  // Update best time after deletion
                  updateBestTimeFromRecords(puzzleId);
                }
              });
            } catch (error) {
              console.error("Error deleting time record:", error);
              Alert.alert("Error", "Failed to delete time record");
            }
          },
        },
      ]
    );
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get the best (highest) PPM from all time records for this puzzle
  const getBestPPM = () => {
    if (!timeRecords || timeRecords.length === 0) return "0.00";

    // Find the highest PPM value
    let bestPPM = 0;
    timeRecords.forEach((record) => {
      if (record.ppm > bestPPM) {
        bestPPM = record.ppm;
      }
    });

    return bestPPM.toFixed(2);
  };

  if (!puzzleItem) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Puzzle Info */}
        <View style={styles.puzzleInfoContainer}>
          <Image
            source={
              puzzleItem.imageUri
                ? { uri: puzzleItem.imageUri }
                : require("../assets/images/placeholder.png")
            }
            style={styles.puzzleImage}
          />
          <View style={styles.puzzleDetails}>
            <Text style={styles.puzzleName}>{puzzleItem.name}</Text>
            <Text style={styles.puzzleText}>{puzzleItem.brand}</Text>
            <Text style={styles.puzzleText}>{puzzleItem.pieces} pieces</Text>
          </View>
          <View style={styles.bestTimeContainer}>
            <Text style={styles.bestTimeLabel}>Best Time</Text>
            <Text style={styles.bestTimeText}>
              {`${String(puzzleItem.bestTimeHours || 0).padStart(
                2,
                "0"
              )}:${String(puzzleItem.bestTimeMinutes || 0).padStart(
                2,
                "0"
              )}:${String(puzzleItem.bestTimeSeconds || 0).padStart(2, "0")}`}
            </Text>
            <Text style={styles.bestTimeLabel}>Best PPM</Text>
            <Text style={styles.bestTimeText}>{getBestPPM()}</Text>
          </View>
        </View>

        {/* Stopwatch */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerDisplay}>{formatTime(time)}</Text>

          <View style={styles.timerButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.timerButton,
                styles.resetButton,
                { backgroundColor: colors.danger },
              ]}
              onPress={resetTimer}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timerButton,
                styles.toggleButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={toggleTimer}
            >
              <Icon
                name={isRunning ? "pause" : "play"}
                size={30}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timerButton,
                styles.submitButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={submitStopwatchTime}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual Time Entry */}
        <View style={styles.manualTimeContainer}>
          <Text style={styles.sectionTitle}>Manually Log Time:</Text>
          <View style={styles.timeInputRow}>
            <TextInput
              style={styles.timeInput}
              placeholder="HH"
              value={hours}
              onChangeText={setHours}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="MM"
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="SS"
              value={seconds}
              onChangeText={setSeconds}
              keyboardType="numeric"
              maxLength={2}
            />

            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: colors.primary }]}
              onPress={submitManualTime}
            >
              <Text style={styles.buttonText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Records */}
        <View style={styles.recordsContainer}>
          <Text style={styles.sectionTitle}>My Times</Text>

          {/* Table Headers */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Date</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Time</Text>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>PPM</Text>
          </View>

          {timeRecords.length === 0 ? (
            <Text style={styles.noRecordsText}>No times recorded yet</Text>
          ) : (
            <FlatList
              style={styles.recordsList}
              contentContainerStyle={styles.recordsListContent}
              data={timeRecords}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Swipeable
                  friction={2}
                  overshootRight={false}
                  containerStyle={{ backgroundColor: "#F5F7F3" }}
                  childrenContainerStyle={{ backgroundColor: "#F5F7F3" }}
                  renderRightActions={(progress, dragX) => (
                    <View
                      style={{
                        width: 80,
                        backgroundColor: "#9e2424",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          width: "100%",
                          height: "100%",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onPress={() => deleteTimeRecord(item.id)}
                      >
                        <Text style={{ color: "white", fontWeight: "bold" }}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                >
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>
                      {formatDate(item.date)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>
                      {formatTime(item.timeInSeconds)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>
                      {item.ppm.toFixed(2)}
                    </Text>
                  </View>
                </Swipeable>
              )}
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 100, // Increased top padding for even more space
    backgroundColor: "#F5F7F3",
  },
  backButton: {
    position: "absolute",
    top: 50, // Moved down further to add more space above
    left: 16,
    zIndex: 1,
    padding: 10, // Added padding to make touch target larger
  },
  backButtonText: {
    fontSize: 18,
    color: "#555",
    fontFamily: "Sora",
  },
  puzzleInfoContainer: {
    flexDirection: "row",
    marginTop: 10, // Added margin top to create more space below back button
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 15,
  },
  puzzleImage: {
    width: 100,
    height: 75,
    borderRadius: 5,
    marginRight: 10,
  },
  puzzleDetails: {
    flex: 1,
  },
  puzzleName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    fontFamily: "Sora-Bold",
  },
  puzzleText: {
    fontSize: 14,
    color: "#555",
    fontFamily: "Sora",
  },
  timerContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  timerDisplay: {
    fontSize: 64, // Increased from 48 to 64
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "Sora-Bold",
  },
  timerButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Add this to vertically center the buttons
    width: "100%",
    paddingHorizontal: 20,
  },
  timerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    height: 40, // Half the height of the play/pause button
  },
  submitButton: {
    height: 40, // Half the height of the play/pause button
  },
  toggleButton: {
    width: 80, // Make it square by giving explicit width
    height: 80, // Make it square by giving explicit height
    padding: 0, // Remove padding to better control dimensions
    borderRadius: 10, // Slightly rounded corners for a square shape
    marginHorizontal: 10, // Add some horizontal margin to center it better
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Sora-Bold",
  },
  manualTimeContainer: {
    marginVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 15,
    alignItems: "center", // Center all content horizontally
  },
  sectionTitle: {
    fontSize: 22, // Increased font size
    fontWeight: "bold",
    marginTop: 10, // Added more space above title
    marginBottom: 15, // Added more space below title
    textAlign: "center", // Center text
    width: "100%",
    fontFamily: "Sora-Bold",
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center horizontally
    marginBottom: 10,
  },
  timeInput: {
    width: 50,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 20,
    marginHorizontal: 5,
    fontFamily: "Sora",
  },
  logButton: {
    marginLeft: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  recordsContainer: {
    flex: 1,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 15,
    display: "flex",
    flexDirection: "column",
  },
  recordsList: {
    flex: 1,
    width: "100%",
  },
  recordsListContent: {
    paddingBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 5,
    marginTop: 10,
    marginBottom: 5,
  },
  headerCell: {
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Sora-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCell: {
    fontSize: 14,
    fontFamily: "Sora",
  },
  noRecordsText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontStyle: "italic",
    fontFamily: "Sora",
  },
  rightActionsContainer: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteActionContainer: {
    flex: 1,
    backgroundColor: "#9e2424",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  deleteActionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Sora-Bold",
  },
  bestTimeContainer: {
    marginLeft: "auto",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  bestTimeLabel: {
    fontSize: 12,
    color: "#555",
    fontFamily: "Sora",
    marginTop: 5,
  },
  bestTimeText: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Sora-Bold",
  },
});

export default Timer;
