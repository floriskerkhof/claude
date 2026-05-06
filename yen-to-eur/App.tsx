import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import MlkitOcr from 'react-native-mlkit-ocr';

const FALLBACK_RATE_JPY_TO_EUR = 0.0062; // 1 JPY ≈ 0.0062 EUR (1 EUR ≈ 161 JPY)
const SCAN_INTERVAL_MS = 1500;

// Match ¥1,200 / ￥1200 / 1,200円 / 1200円
const YEN_REGEX = /(?:[¥￥]\s*([0-9][0-9,]*(?:\.[0-9]+)?)|([0-9][0-9,]*(?:\.[0-9]+)?)\s*円)/g;

function extractYenPrices(text: string): number[] {
  const seen = new Set<number>();
  let match: RegExpExecArray | null;
  const re = new RegExp(YEN_REGEX.source, 'g');
  while ((match = re.exec(text)) !== null) {
    const raw = (match[1] ?? match[2]).replace(/,/g, '');
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0 && val < 10_000_000) seen.add(val);
  }
  return Array.from(seen).sort((a, b) => a - b);
}

function formatEur(eur: number): string {
  if (eur >= 1000) return `€${Math.round(eur).toLocaleString()}`;
  if (eur >= 10) return `€${eur.toFixed(2)}`;
  return `€${eur.toFixed(2)}`;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [eurPerJpy, setEurPerJpy] = useState(FALLBACK_RATE_JPY_TO_EUR);
  const [rateIsLive, setRateIsLive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [prices, setPrices] = useState<{ jpy: number; eur: string }[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/JPY')
      .then(r => r.json())
      .then(data => {
        const rate = data?.rates?.EUR;
        if (typeof rate === 'number' && rate > 0) {
          setEurPerJpy(rate);
          setRateIsLive(true);
        }
      })
      .catch(() => {});
  }, []);

  const scanOnce = useCallback(async () => {
    if (!cameraRef.current || processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
      if (!photo) return;
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.75 }
      );
      const blocks = await MlkitOcr.detectFromUri(resized.uri);
      const fullText = blocks.map(b => b.text).join(' ');
      const jpyPrices = extractYenPrices(fullText);
      if (jpyPrices.length > 0) {
        setPrices(jpyPrices.map(jpy => ({ jpy, eur: formatEur(jpy * eurPerJpy) })));
      }
    } catch (e) {
      console.warn('Scan error:', e);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [eurPerJpy]);

  const toggleScanning = () => {
    if (scanning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setScanning(false);
      setPrices([]);
    } else {
      setScanning(true);
      scanOnce();
      intervalRef.current = setInterval(scanOnce, SCAN_INTERVAL_MS);
    }
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permScreen}>
        <Text style={styles.permTitle}>Camera Permission Required</Text>
        <Text style={styles.permMsg}>
          This app needs camera access to scan ¥ prices and convert them to €.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const jpyPerEur = Math.round(1 / eurPerJpy);
  const rateLabel = `1 € = ¥${jpyPerEur.toLocaleString()}${rateIsLive ? '  (live)' : '  (offline)'}`;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* top bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.ratePill}>
          <Text style={styles.rateText}>{rateLabel}</Text>
        </View>
      </SafeAreaView>

      {/* price cards */}
      {prices.length > 0 && (
        <View style={styles.cardsWrapper}>
          <ScrollView contentContainerStyle={styles.cards}>
            {prices.map(({ jpy, eur }, i) => (
              <View key={i} style={styles.card}>
                <Text style={styles.eurAmt}>{eur}</Text>
                <Text style={styles.jpyAmt}>¥{jpy.toLocaleString()}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* bottom controls */}
      <View style={styles.bottomBar}>
        {processing && <ActivityIndicator color="#fff" size="small" style={{ marginBottom: 10 }} />}
        <TouchableOpacity
          style={[styles.scanBtn, scanning && styles.scanBtnStop]}
          onPress={toggleScanning}
          activeOpacity={0.8}
        >
          <Text style={styles.scanBtnText}>{scanning ? '⏹  Stop' : '⦿  Scan Prices'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // permission screen
  permScreen: { flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', alignItems: 'center', padding: 32 },
  permTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  permMsg: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn: { backgroundColor: '#1a6aff', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 28 },
  permBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // top bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 0 : 8 },
  ratePill: { backgroundColor: 'rgba(0,0,0,0.62)', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, marginTop: 8 },
  rateText: { color: '#FFD700', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },

  // price cards
  cardsWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 12,
    maxHeight: '55%',
    width: 148,
  },
  cards: { paddingBottom: 8 },
  card: {
    backgroundColor: 'rgba(5, 10, 40, 0.88)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(80, 140, 255, 0.45)',
    alignItems: 'center',
  },
  eurAmt: { color: '#3DFFA0', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  jpyAmt: { color: '#888', fontSize: 12, marginTop: 3 },

  // bottom
  bottomBar: { position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center' },
  scanBtn: {
    backgroundColor: 'rgba(20, 100, 220, 0.9)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(100, 160, 255, 0.55)',
    shadowColor: '#1a6aff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  scanBtnStop: {
    backgroundColor: 'rgba(180, 30, 30, 0.9)',
    borderColor: 'rgba(255, 100, 100, 0.55)',
    shadowColor: '#ff4040',
  },
  scanBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
});
