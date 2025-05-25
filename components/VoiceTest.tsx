import React, { useEffect, useState } from 'react';
import { View, Text, NativeModules, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function VoiceTest() {
  const [debug, setDebug] = useState('Checking...');

  useEffect(() => {
    // Log available native modules
    const modules = Object.keys(NativeModules);
    console.log('Available native modules:', modules);
    console.log('Voice module:', NativeModules.Voice);
    setDebug(`Modules: ${modules.join(', ')}\nVoice: ${JSON.stringify(NativeModules.Voice, null, 2)}`);
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Platform: {Platform.OS}</Text>
      <Text>Debug Info:</Text>
      <Text>{debug}</Text>
    </View>
  );
} 