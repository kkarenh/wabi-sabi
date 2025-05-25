import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, PermissionsAndroid, Platform, Alert, NativeModules } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function VoiceJournal() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [volume, setVolume] = useState(-1);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [noSpeechTimeout, setNoSpeechTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pauseTimeout, setPauseTimeout] = useState<NodeJS.Timeout | null>(null);
  const PAUSE_TOLERANCE_MS = 5000; // 5 seconds pause tolerance

  useEffect(() => {
    let mounted = true;

    const initializeVoice = async () => {
      try {
        // Check if Voice module exists
        if (!NativeModules.Voice) {
          throw new Error('Voice module not found');
        }

        // Destroy any existing instance
        await Voice.destroy();

        // Set up voice recognition
        Voice.onSpeechStart = onSpeechStartHandler;
        Voice.onSpeechResults = onSpeechResultsHandler;
        Voice.onSpeechEnd = onSpeechEndHandler;
        Voice.onSpeechError = onSpeechErrorHandler;
        Voice.onSpeechRecognized = onSpeechRecognizedHandler;
        Voice.onSpeechPartialResults = onSpeechPartialResultsHandler;
        Voice.onSpeechVolumeChanged = onSpeechVolumeChangedHandler;

        // Check network if on Android
        if (Platform.OS === 'android') {
          await checkNetworkConnection();
          
          // Pre-request microphone permission
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
            console.log('Microphone permission denied during initialization');
          }
        }
        
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (err: any) {
        console.log('Voice initialization error:', {
          error: err,
          message: err?.message,
        });
        if (mounted) {
          setError('Voice recognition initialization failed. Please restart the app.');
        }
      }
    };

    initializeVoice();

    return () => {
      mounted = false;
      if (noSpeechTimeout) {
        clearTimeout(noSpeechTimeout);
      }
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
      }
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Monitor volume levels and show warning if too low
  useEffect(() => {
    if (isRecording && volume < -1) {
      const timeout = setTimeout(() => {
        if (volume < -1 && !isSpeechDetected && isRecording) {
          setError('Voice volume is too low. Try speaking louder or moving closer to the microphone.');
        }
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [isRecording, volume, isSpeechDetected]);

  const checkNetworkConnection = async () => {
    try {
      const response = await fetch('https://www.google.com');
      const connected = response.status === 200;
      setIsConnected(connected);
    } catch (err: any) {
      console.log('Network check error:', {
        error: err,
        message: err?.message,
      });
      setIsConnected(false);
    }
  };

  const resetRecording = () => {
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
    }
    // Start a new pause timeout
    const timeout = setTimeout(async () => {
      if (isRecording) {
        console.log('Pause detected, restarting recording');
        try {
          await Voice.stop();
          // Small delay to ensure clean restart
          setTimeout(async () => {
            if (isRecording) {  // Double check we still want to record
              await Voice.start('en-US');
            }
          }, 100);
        } catch (err: any) {
          console.log('Error restarting recording:', err?.message);
        }
      }
    }, PAUSE_TOLERANCE_MS);
    setPauseTimeout(timeout);
  };

  const onSpeechVolumeChangedHandler = (e: any) => {
    const newVolume = e?.value ?? -1;
    setVolume(newVolume);
    
    // Consider speech detected if volume is above threshold
    if (newVolume > -1) {
      setIsSpeechDetected(true);
      setError(''); // Clear any volume-related errors
      resetRecording(); // Reset the recording timeout
      
      // Reset the no-speech timeout
      if (noSpeechTimeout) {
        clearTimeout(noSpeechTimeout);
      }
      const timeout = setTimeout(() => {
        setIsSpeechDetected(false);
      }, 1000);
      setNoSpeechTimeout(timeout);
    }
  };

  const onSpeechPartialResultsHandler = (e: any) => {
    console.log('Partial results:', {
      results: e?.value,
      time: new Date().toISOString(),
      hasValue: Boolean(e?.value),
      resultCount: e?.value?.length
    });
    if (e?.value) {
      setPartialResults(e.value);
    }
  };

  const onSpeechRecognizedHandler = (e: any) => {
    console.log('Speech recognized event:', {
      event: e,
      time: new Date().toISOString(),
      isRecording,
      hasPartialResults: partialResults.length > 0
    });
    setError('');
  };

  const onSpeechStartHandler = () => {
    setIsRecording(true);
    setError('');
    setPartialResults([]);
    resetRecording(); // Start the pause timeout
  };

  const onSpeechResultsHandler = (e: any) => {
    console.log('Speech results received:', {
      hasValue: Boolean(e?.value),
      resultCount: e?.value?.length,
      isRecording
    });
    
    if (e?.value && e.value[0]) {
      // Append to existing transcript if we're still recording
      if (isRecording) {
        setTranscript(prev => prev ? `${prev} ${e.value[0]}` : e.value[0]);
      } else {
        setTranscript(e.value[0]);
      }
      setError('');
      setPartialResults([]);
      resetRecording(); // Reset the pause timeout when we get results
    }
  };

  const onSpeechEndHandler = () => {
    console.log('Speech end detected');
    // Only stop recording if we're not within our pause tolerance window
    if (!pauseTimeout) {
      console.log('No active pause timeout, stopping recording');
      setIsRecording(false);
      
      // If we have partial results but no final results, use the last partial result
      if (partialResults.length > 0 && !transcript) {
        setTranscript(partialResults[partialResults.length - 1]);
        setPartialResults([]);
      }
    } else {
      console.log('Within pause tolerance window, continuing recording');
    }
  };

  const onSpeechErrorHandler = (e: any) => {
    // Don't show errors if we're not actually trying to record
    if (!isRecording) return;
    
    setIsRecording(false);
    
    if (Platform.OS === 'android') {
      if (!isConnected) {
        setError('Please check your internet connection and try again.');
        return;
      }

      switch (e?.error?.code) {
        case '7':
          // If we have partial results, use them instead of showing an error
          if (partialResults.length > 0) {
            setTranscript(partialResults[partialResults.length - 1]);
            setPartialResults([]);
            setError('');
          } else {
            setError('No speech detected. Try speaking louder and closer to the microphone.');
          }
          break;
        case '11':
        case '13':
          setError("Couldn't understand. Try speaking at a normal pace in a quiet environment.");
          break;
        case '5':
          setError('Speech service unavailable. Please check your internet connection and try again.');
          break;
        case '6':
          setError('Speech service error. Please try again in a moment.');
          break;
        case '1':
        case '2':
        case '3':
          setError('Network or server error. Please check your connection and try again.');
          break;
        default:
          setError(`Recognition error (${e?.error?.code}). Please try again.`);
      }
    } else {
      // iOS error handling
      switch (e?.error?.code) {
        case '7':
          if (partialResults.length > 0) {
            setTranscript(partialResults[partialResults.length - 1]);
            setPartialResults([]);
            setError('');
          } else {
            setError('No speech was detected. Please try again.');
          }
          break;
        case '11':
        case '13':
          setError("I couldn't understand that. Please try again.");
          break;
        default:
          setError('Something went wrong. Please try again.');
      }
    }
  };

  const startRecording = async () => {
    if (!isInitialized) {
      setError('Voice recognition is still initializing. Please wait a moment and try again.');
      return;
    }

    if (!NativeModules.Voice) {
      setError('Voice module not available. Please restart the app.');
      return;
    }

    setError('');
    setPartialResults([]);
    
    if (Platform.OS === 'android') {
      // Check network connectivity first
      await checkNetworkConnection();
      if (!isConnected) {
        setError('Please check your internet connection before starting.');
        return;
      }

      // Check microphone permission
      try {
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
          setError('Microphone permission is required to record voice.');
          return;
        }
      } catch (err: any) {
        console.log('Error requesting microphone permission:', {
          error: err,
          message: err?.message,
        });
        setError('Error requesting microphone permission.');
        return;
      }
    }

    try {
      // Ensure Voice is initialized
      if (!Voice.isAvailable) {
        await Voice.destroy();
        Voice.onSpeechStart = onSpeechStartHandler;
        Voice.onSpeechResults = onSpeechResultsHandler;
        Voice.onSpeechEnd = onSpeechEndHandler;
        Voice.onSpeechError = onSpeechErrorHandler;
        Voice.onSpeechRecognized = onSpeechRecognizedHandler;
        Voice.onSpeechPartialResults = onSpeechPartialResultsHandler;
        Voice.onSpeechVolumeChanged = onSpeechVolumeChangedHandler;
      }

      await Voice.start('en-US');
      setTranscript('');
    } catch (error: any) {
      console.error('Start recording error:', {
        error,
        message: error?.message,
      });
      if (Platform.OS === 'android') {
        setError('Failed to start recording. Please check your internet connection and try again.');
      } else {
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = async () => {
    // Clear any pending pause timeouts
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      setPauseTimeout(null);
    }
    
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error: any) {
      console.error('Stop recording error:', {
        error,
        message: error?.message,
      });
      setError('Failed to stop recording. Please try again.');
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
          style={[
            styles.micButton,
            isRecording && styles.micButtonRecording
          ]}
          onPress={toggleRecording}
        >
          <Text style={styles.micButtonText}>{isRecording ? '■' : '●'}</Text>
        </TouchableOpacity>
        <Text style={styles.recordingStatus}>
          {isRecording ? 'Recording...' : 'Tap to start recording'}
        </Text>
        {isRecording && (
          <View style={styles.volumeIndicator}>
            <View style={[styles.volumeBar, { width: `${Math.max((volume + 2) * 25, 0)}%` }]} />
          </View>
        )}
        {!transcript && partialResults.length > 0 && (
          <Text style={styles.partialText}>
            {partialResults[partialResults.length - 1]}
          </Text>
        )}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  micButtonRecording: { backgroundColor: '#9B6A6C' },
  micButtonText: { color: '#fff', fontSize: 24 },
  recordingStatus: { color: '#766E62', fontSize: 16, marginBottom: 8 },
  volumeIndicator: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E0D5',
    borderRadius: 2,
    marginVertical: 8,
    overflow: 'hidden',
  },
  volumeBar: {
    height: '100%',
    backgroundColor: '#8B9D77',
    borderRadius: 2,
  },
  errorText: { 
    color: '#9B6A6C', 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8,
    maxWidth: '80%',
    lineHeight: 20
  },
  partialText: {
    color: '#766E62',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
  },
  transcriptContainer: { marginTop: 20 },
  transcriptLabel: { fontSize: 14, color: '#766E62', marginBottom: 8, letterSpacing: 1 },
  transcriptCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  transcriptText: { fontSize: 16, color: '#2C2C2C', lineHeight: 24 },
});
