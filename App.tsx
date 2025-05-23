// Resonate - A Wabi-Sabi Journal
// Embracing imperfection and mindfulness in daily reflection

import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TextJournal from './components/TextJournal';
import VoiceJournal from './components/VoiceJournal';

type JournalMode = 'text' | 'voice';

export default function App() {
  const [mode, setMode] = useState<JournalMode>('text');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'text' && styles.toggleButtonActive]}
            onPress={() => setMode('text')}
          >
            <Text style={[styles.toggleText, mode === 'text' && styles.toggleTextActive]}>
              Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, mode === 'voice' && styles.toggleButtonActive]}
            onPress={() => setMode('voice')}
          >
            <Text style={[styles.toggleText, mode === 'voice' && styles.toggleTextActive]}>
              Voice
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {mode === 'text' ? <TextJournal /> : <VoiceJournal />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EA',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D5',
  },
  title: {
    fontSize: 24,
    fontFamily: 'System',
    color: '#2C2C2C',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 21,
  },
  toggleButtonActive: {
    backgroundColor: '#766E62',
  },
  toggleText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#766E62',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
