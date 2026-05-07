import React from 'react';
import { StatusBar } from 'expo-status-bar';
import EditorScreen from './src/screens/EditorScreen';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <EditorScreen />
    </>
  );
}
