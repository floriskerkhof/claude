import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Template, Slot } from '../templates';

interface Props {
  template: Template;
  photos: (string | null)[];
  size: number; // square canvas pixel size
  canvasRef?: React.RefObject<View>;
}

function SlotView({ slot, photo, canvasSize }: { slot: Slot; photo: string | null; canvasSize: number }) {
  const left = slot.x * canvasSize;
  const top = slot.y * canvasSize;
  const width = slot.width * canvasSize;
  const height = slot.height * canvasSize;
  const rotation = slot.rotation ?? 0;

  const isPolaroid = slot.shape === 'polaroid';
  const isCircle = slot.shape === 'circle';
  const captionHeight = isPolaroid ? Math.max(16, height * 0.12) : 0;
  const photoHeight = height - captionHeight;

  const containerStyle = {
    position: 'absolute' as const,
    left,
    top,
    width,
    height,
    transform: [{ rotate: `${rotation}deg` }],
    zIndex: slot.zIndex ?? 0,
    borderRadius: isCircle ? width / 2 : isPolaroid ? 4 : 3,
    overflow: 'hidden' as const,
    backgroundColor: photo ? undefined : '#e0dbd4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: isPolaroid ? 3 : 1 },
    shadowOpacity: isPolaroid ? 0.20 : 0.08,
    shadowRadius: isPolaroid ? 6 : 2,
    elevation: slot.zIndex ?? 1,
  };

  if (isPolaroid) {
    return (
      <View style={[containerStyle, { backgroundColor: '#fff', overflow: 'visible' }]}>
        <View style={{ overflow: 'hidden', borderRadius: 2, width, height: photoHeight, backgroundColor: photo ? undefined : '#e0dbd4' }}>
          {photo ? (
            <Image source={{ uri: photo }} style={{ width, height: photoHeight }} resizeMode="cover" />
          ) : (
            <View style={[styles.emptySlot, { width, height: photoHeight }]}>
              <Text style={styles.emptyIcon}>+</Text>
            </View>
          )}
        </View>
        <View style={{ height: captionHeight, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {photo ? (
        <Image source={{ uri: photo }} style={{ width, height }} resizeMode="cover" />
      ) : (
        <View style={[styles.emptySlot, { width, height }]}>
          <Text style={styles.emptyIcon}>+</Text>
        </View>
      )}
    </View>
  );
}

export default function ScrapbookCanvas({ template, photos, size, canvasRef }: Props) {
  return (
    <View
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        backgroundColor: template.backgroundColor,
        overflow: 'hidden',
        borderRadius: 12,
      }}
    >
      {template.slots.map((slot, i) => (
        <SlotView
          key={slot.id}
          slot={slot}
          photo={photos[i] ?? null}
          canvasSize={size}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddd8d0',
  },
  emptyIcon: {
    fontSize: 28,
    color: '#aaa49c',
    fontWeight: '300',
  },
});
