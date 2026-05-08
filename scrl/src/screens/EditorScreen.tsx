import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';

import { TEMPLATES, Template } from '../templates';
import ScrapbookCanvas from '../components/ScrapbookCanvas';
import TemplatePicker from '../components/TemplatePicker';
import * as ImagePicker from 'expo-image-picker';

export default function EditorScreen() {
  const { width } = useWindowDimensions();
  const canvasSize = width - 32;

  const [template, setTemplate] = useState<Template>(TEMPLATES[0]);
  const [photos, setPhotos] = useState<(string | null)[]>(Array(TEMPLATES[0].photoCount).fill(null));
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<View>(null);

  const switchTemplate = useCallback((t: Template) => {
    setTemplate(t);
    setPhotos((prev) => {
      const next: (string | null)[] = Array(t.photoCount).fill(null);
      for (let i = 0; i < Math.min(prev.length, t.photoCount); i++) {
        next[i] = prev[i];
      }
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  async function pickPhoto(index: number) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const existing = photos[index];
    if (existing) {
      Alert.alert('Photo', undefined, [
        { text: 'Replace', onPress: () => openPicker(index) },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setPhotos((p) => { const n = [...p]; n[index] = null; return n; }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    openPicker(index);
  }

  async function openPicker(index: number) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((p) => { const n = [...p]; n[index] = result.assets[0].uri; return n; });
    }
  }

  async function handleSaveAndShare() {
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const uri = await captureRef(canvasRef, {
        format: 'jpg',
        quality: 0.97,
        result: 'tmpfile',
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();

      const canShare = await Sharing.isAvailableAsync();

      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Share your scrapbook page',
          });
        } else {
          Alert.alert('Saved!', 'Your scrapbook page was saved to Photos.');
        }
      } else if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your scrapbook page',
        });
      } else {
        Alert.alert('Permission needed', 'Allow photo library access to save your page.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save the page. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const filledCount = photos.filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>scrl</Text>
        <TouchableOpacity
          style={[styles.saveBtn, filledCount === 0 && styles.saveBtnDisabled]}
          onPress={handleSaveAndShare}
          disabled={filledCount === 0 || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save & Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Canvas */}
        <View style={styles.canvasWrap}>
          <View ref={canvasRef} collapsable={false}>
            <ScrapbookCanvas
              template={template}
              photos={photos}
              size={canvasSize}
            />
          </View>
          {/* Tap overlay per slot */}
          <View
            style={[StyleSheet.absoluteFill, { borderRadius: 12, overflow: 'hidden' }]}
            pointerEvents="box-none"
          >
            {template.slots.map((slot, i) => {
              const rotation = slot.rotation ?? 0;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={{
                    position: 'absolute',
                    left: slot.x * canvasSize,
                    top: slot.y * canvasSize,
                    width: slot.width * canvasSize,
                    height: slot.height * canvasSize,
                    transform: [{ rotate: `${rotation}deg` }],
                    zIndex: (slot.zIndex ?? 0) + 10,
                    borderRadius: slot.shape === 'circle' ? (slot.width * canvasSize) / 2 : slot.shape === 'polaroid' ? 4 : 3,
                  }}
                  onPress={() => pickPhoto(i)}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {filledCount === 0
              ? 'Tap a slot to add a photo'
              : filledCount < template.photoCount
              ? `${template.photoCount - filledCount} more slot${template.photoCount - filledCount > 1 ? 's' : ''} to fill`
              : 'All slots filled — ready to save!'}
          </Text>
        </View>

        {/* Template picker */}
        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Layout</Text>
          <TemplatePicker selected={template} onSelect={switchTemplate} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#1a1a1a',
  },
  saveBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    minWidth: 110,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  scroll: {
    paddingBottom: 40,
    gap: 16,
  },
  canvasWrap: {
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  hint: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  pickerSection: {
    gap: 10,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
  },
});
