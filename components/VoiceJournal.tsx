import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function VoiceJournal() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechResults = (event) => {
      if (event.value) setTranscript(event.value.join(' '));
    };
    Voice.onSpeechError = (event) => {
      if (event.error?.message) {
        setError(event.error.message);
      } else {
        setError('An unknown error occurred');
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startRecording = async () => {
    setTranscript('');
    setError(null);
    try {
      await Voice.start('en-US');
    } catch (e: any) {
      Alert.alert('Error starting voice recognition', e.message || 'Unknown error');
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e: any) {
      Alert.alert('Error stopping voice recognition', e.message || 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.micButton, isRecording && styles.micButtonActive]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.micText}>{isRecording ? 'Stop' : 'Start'} Recording</Text>
      </TouchableOpacity>

      {isRecording && <ActivityIndicator size="large" color="#766E62" style={{ marginTop: 20 }} />}

      <Text style={styles.transcript}>{transcript || 'Your speech will appear here...'}</Text>

      {error && <Text style={styles.errorText}>Error: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EA',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#766E62',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  micButtonActive: {
    backgroundColor: '#A1887F',
  },
  micText: {
    color: '#fff',
    fontSize: 18,
  },
  transcript: {
    marginTop: 40,
    fontSize: 18,
    color: '#2C2C2C',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    color: 'red',
  },
});
