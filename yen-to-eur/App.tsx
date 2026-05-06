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
  TextInput,
  Clipboard,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import MlkitOcr from 'react-native-mlkit-ocr';

const FALLBACK_RATE_JPY_TO_EUR = 0.0062;
const SCAN_INTERVAL_MS = 1500;

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
  return `€${eur.toFixed(2)}`;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [eurPerJpy, setEurPerJpy] = useState(FALLBACK_RATE_JPY_TO_EUR);
  const [rateIsLive, setRateIsLive] = useState(false);
  const [customRate, setCustomRate] = useState('');
  const [showRateInput, setShowRateInput] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [prices, setPrices] = useState<{ jpy: number; eur: string }[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
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

  const activeRate = (() => {
    const parsed = parseFloat(customRate);
    if (!isNaN(parsed) && parsed > 0) return 1 / parsed;
    return eurPerJpy;
  })();

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
        setPrices(jpyPrices.map(jpy => ({ jpy, eur: formatEur(jpy * activeRate) })));
      }
    } catch (e) {
      console.warn('Scan error:', e);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [activeRate]);

  const toggleScanning = () => {
    if (scanning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setScanning(false);
    } else {
      setScanning(true);
      scanOnce();
      intervalRef.current = setInterval(scanOnce, SCAN_INTERVAL_MS);
    }
  };

  const copyPrice = (jpy: number, eur: string) => {
    Clipboard.setString(`¥${jpy.toLocaleString()} = ${eur}`);
    setCopied(jpy);
    Vibration.vibrate(40);
    setTimeout(() => setCopied(null), 1500);
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

  const jpyPerEur = Math.round(1 / activeRate);
  const rateSource = customRate ? 'custom' : rateIsLive ? 'live' : 'offline';
  const rateLabel = `1 € = ¥${jpyPerEur.toLocaleString()}  (${rateSource})`;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />

      <SafeAreaView style={styles.topBar}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
          >
            <Text style={styles.iconText}>{flash === 'on' ? '⚡' : '🔦'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowRateInput(v => !v)}>
            <View style={styles.ratePill}>
              <Text style={styles.rateText}>{rateLabel}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setPrices([])}
            disabled={prices.length === 0}
          >
            <Text style={[styles.iconText, prices.length === 0 && { opacity: 0.3 }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {showRateInput && (
          <View style={styles.rateInputRow}>
            <TextInput
              style={styles.rateInput}
              placeholder="JPY per EUR  e.g. 162"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={customRate}
              onChangeText={setCustomRate}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setCustomRate(''); setShowRateInput(false); }}>
              <Text style={styles.rateReset}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {prices.length > 0 && (
        <View style={styles.cardsWrapper}>
          <ScrollView contentContainerStyle={styles.cards}>
            {prices.map(({ jpy, eur }, i) => (
              <TouchableOpacity key={i} onPress={() => copyPrice(jpy, eur)} activeOpacity={0.7}>
                <View style={[styles.card, copied === jpy && styles.cardCopied]}>
                  <Text style={styles.eurAmt}>{eur}</Text>
                  <Text style={styles.jpyAmt}>¥{jpy.toLocaleString()}</Text>
                  {copied === jpy && <Text style={styles.copiedLabel}>Copied!</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomBar}>
        {processing && <ActivityIndicator color="#fff" size="small" style={{ marginBottom: 10 }} />}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.snapBtn}
            onPress={scanOnce}
            disabled={processing || scanning}
            activeOpacity={0.7}
          >
            <Text style={styles.snapBtnText}>📷</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnStop]}
            onPress={toggleScanning}
            activeOpacity={0.8}
          >
            <Text style={styles.scanBtnText}>{scanning ? '⏹  Stop' : '⦿  Auto Scan'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  permScreen: { flex: 1, backgroundColor: '#0a0a1a', justifyContent: 'center', alignItems: 'center', padding: 32 },
  permTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  permMsg: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn: { backgroundColor: '#1a6aff', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 28 },
  permBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: Platform.OS === 'ios' ? 0 : 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 8 },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  rateInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  rateInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 4 },
  rateReset: { color: '#ff6b6b', fontSize: 13, fontWeight: '600', marginLeft: 10 },
  ratePill: { backgroundColor: 'rgba(0,0,0,0.62)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  rateText: { color: '#FFD700', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  cardsWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: 12,
    maxHeight: '55%',
    width: 152,
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
  cardCopied: { borderColor: '#3DFFA0', backgroundColor: 'rgba(5, 40, 20, 0.9)' },
  eurAmt: { color: '#3DFFA0', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  jpyAmt: { color: '#888', fontSize: 12, marginTop: 3 },
  copiedLabel: { color: '#3DFFA0', fontSize: 10, marginTop: 4, fontWeight: '600' },

  bottomBar: { position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  snapBtn: {
    backgroundColor: 'rgba(60, 60, 60, 0.9)',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  snapBtnText: { fontSize: 24 },
  scanBtn: {
    backgroundColor: 'rgba(20, 100, 220, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(100, 160, 255, 0.55)',
    elevation: 8,
  },
  scanBtnStop: {
    backgroundColor: 'rgba(180, 30, 30, 0.9)',
    borderColor: 'rgba(255, 100, 100, 0.55)',
  },
  scanBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.4 },
});
