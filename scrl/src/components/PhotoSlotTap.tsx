import React from 'react';
import { TouchableOpacity, View, Image, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

interface Props {
  uri: string | null;
  index: number;
  onPhoto: (index: number, uri: string) => void;
  onRemove: (index: number) => void;
  size: number;
  style?: object;
}

export default function PhotoSlotTap({ uri, index, onPhoto, onRemove, size, style }: Props) {
  async function pick() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (uri) {
      Alert.alert('Photo', undefined, [
        { text: 'Replace', onPress: openPicker },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(index) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    openPicker();
  }

  async function openPicker() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      onPhoto(index, result.assets[0].uri);
    }
  }

  return (
    <TouchableOpacity onPress={pick} activeOpacity={0.85} style={style}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <View style={[styles.empty, { width: size, height: size }]}>
          <Text style={styles.plus}>+</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: '#e8e4de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 26,
    color: '#b0aa9f',
    fontWeight: '300',
  },
});
