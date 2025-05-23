import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, PermissionsAndroid, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function VoiceJournal() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStartHandler;
    Voice.onSpeechResults = onSpeechResultsHandler;
    Voice.onSpeechEnd = onSpeechEndHandler;
    Voice.onSpeechError = onSpeechErrorHandler;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStartHandler = (e: any) => {
    setIsRecording(true);
  };

  const onSpeechResultsHandler = (e: any) => {
    setTranscript(e.value[0]);
  };

  const onSpeechEndHandler = () => {
    setIsRecording(false);
  };

  const onSpeechErrorHandler = (e: any) => {
    console.error(e.error);
    setIsRecording(false);
  };

  const startRecording = async () => {
    if (Platform.OS === 'android') {
      // Request permission on Android
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs access to your microphone to record your voice.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Microphone permission denied');
        return;
      }
    }

    try {
      await Voice.start('en-US');
      setTranscript('');
    } catch (error) {
      console.error(error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.prompt}>Speak your thoughts freely and naturally...</Text>
      <View style={styles.recordingContainer}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={toggleRecording}
        >
          <Text style={styles.micButtonText}>{isRecording ? '■' : '●'}</Text>
        </TouchableOpacity>
        <Text style={styles.recordingStatus}>
          {isRecording ? 'Recording...' : 'Tap to start recording'}
        </Text>
      </View>

      {transcript ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Transcript</Text>
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  prompt: { fontSize: 20, color: '#2C2C2C', marginBottom: 24, fontStyle: 'italic', lineHeight: 28 },
  recordingContainer: { alignItems: 'center', marginVertical: 30 },
  micButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#766E62', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  micButtonRecording: { backgroundColor: '#D64045' },
  micButtonText: { color: '#fff', fontSize: 24 },
  recordingStatus: { color: '#766E62', fontSize: 16 },
  transcriptContainer: { marginTop: 20 },
  transcriptLabel: { fontSize: 14, color: '#766E62', marginBottom: 8, letterSpacing: 1 },
  transcriptCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  transcriptText: { fontSize: 16, color: '#2C2C2C', lineHeight: 24 },
});
