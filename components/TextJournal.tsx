import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

interface JournalEntry {
  id: string;
  content: string;
  prompt: string;
  timestamp: string;
  reflection?: string;
  source: 'local' | 'synced';
}

const PROMPTS = [
  'There is beauty in simplicity.',
  'What did you notice today that was quietly beautiful?',
  'What imperfect thing made your day real?',
  'Reflect on a fleeting moment that brought you peace.',
  'What small imperfections made today beautiful?',
  'How did nature speak to you today?',
  'What has changed in your life that has made you stronger?'
];

export default function TextJournal() {
  const [prompt, setPrompt] = useState('');
  const [entry, setEntry] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    loadEntries();
    rotatePrompt();
  }, []);

  const rotatePrompt = () => {
    const index = Math.floor(Math.random() * PROMPTS.length);
    setPrompt(PROMPTS[index]);
  };

  const loadEntries = async () => {
    const stored = await AsyncStorage.getItem('journalEntries');
    if (stored) setEntries(JSON.parse(stored));
  };

  const saveEntry = async () => {
    if (!entry.trim()) return Alert.alert('A moment of reflection', 'Write what resonates with you.');

    const newEntry: JournalEntry = {
      id: uuidv4(),
      content: entry,
      prompt,
      timestamp: new Date().toISOString(),
      source: 'local',
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setEntry('');
    await AsyncStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    rotatePrompt();
  };

  return (
    <ScrollView style={styles.content}>
      <Text style={styles.prompt}>{prompt}</Text>
      <TextInput
        multiline
        style={styles.input}
        placeholder="Write without editing - let your thoughts flow naturally..."
        placeholderTextColor="#A39E93"
        value={entry}
        onChangeText={setEntry}
      />
      
      <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
        <Text style={styles.saveButtonText}>Capture Moment</Text>
      </TouchableOpacity>

      <View style={styles.entriesContainer}>
        {entries.map((e) => (
          <View key={e.id} style={styles.entryCard}>
            <Text style={styles.entryDate}>{dayjs(e.timestamp).format('MMMM D, YYYY').toUpperCase()}</Text>
            <Text style={styles.entryText}>{e.content}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  prompt: {
    fontSize: 20,
    color: '#2C2C2C',
    marginBottom: 24,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    color: '#2C2C2C',
    marginBottom: 20,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#766E62',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesContainer: {
    gap: 20,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryDate: {
    fontSize: 12,
    color: '#766E62',
    marginBottom: 8,
    letterSpacing: 1,
  },
  entryText: {
    fontSize: 16,
    color: '#2C2C2C',
    lineHeight: 24,
  },
}); 