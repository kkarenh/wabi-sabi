import React, { useEffect, useState } from 'react';
import { View, Text, NativeModules, Platform } from 'react-native';

export default function VoskTest() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const checkVosk = () => {
      try {
        console.log('Available native modules:', Object.keys(NativeModules));
        console.log('VoskModule:', NativeModules.VoskModule);
        console.log('Vosk:', NativeModules.Vosk);
        
        if (!NativeModules.VoskModule && !NativeModules.Vosk) {
          setStatus('Error: Vosk native module not found');
          return;
        }
        
        setStatus('Native module found');
      } catch (err) {
        console.error('Error checking Vosk:', err);
        setStatus('Error: ' + (err?.message || 'Unknown error'));
      }
    };

    checkVosk();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Platform: {Platform.OS}</Text>
      <Text>Status: {status}</Text>
    </View>
  );
} 