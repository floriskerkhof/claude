import React from 'react';
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Template, TEMPLATES } from '../templates';

interface Props {
  selected: Template;
  onSelect: (t: Template) => void;
}

export default function TemplatePicker({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TEMPLATES.map((t) => {
        const isActive = t.id === selected.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(t)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{t.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t.name}</Text>
            <Text style={[styles.count, isActive && styles.countActive]}>{t.photoCount}p</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0ece8',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#fff',
  },
  count: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '400',
  },
  countActive: {
    color: 'rgba(255,255,255,0.6)',
  },
});
