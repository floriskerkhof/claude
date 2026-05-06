# Yen → EUR Camera App

Point your camera at any ¥ price and instantly see its value in €.

## Features

- **Live camera** with on-device OCR (no internet required for scanning)
- Detects `¥1,200`, `￥1200`, `1,200円` and variants
- **Live exchange rate** from open.er-api.com (falls back to cached rate offline)
- All processing happens on-device — no images leave your phone

## How to use

1. Open the app
2. Tap **Scan Prices**
3. Point at a price tag or menu
4. EUR equivalents appear as cards on the right side of the screen
5. Tap **Stop** when done

---

## Building the app

This app uses ML Kit for on-device OCR and requires a **custom native build** (it won't run in Expo Go).

### Prerequisites

```bash
npm install -g eas-cli
npx expo install           # from this directory
```

### Android APK (easiest — no Mac needed)

```bash
eas build -p android --profile preview
```

EAS will build the APK in the cloud and give you a download link (~10 min).  
Install on Android: enable "Install from unknown sources" and open the APK.

### iOS (requires Apple Developer account)

```bash
eas build -p ios --profile preview
```

### Local Android build (requires Android Studio + SDK)

```bash
npx expo run:android --variant release
```

---

## Exchange rate

The app fetches the current JPY/EUR rate from `open.er-api.com` on launch.  
If offline, it falls back to the bundled rate (updated at build time).

## Supported price formats

| Format | Example |
|--------|---------|
| ¥ prefix | `¥1,200` `¥800` |
| ￥ full-width | `￥3,500` |
| 円 suffix | `1,200円` `980円` |
