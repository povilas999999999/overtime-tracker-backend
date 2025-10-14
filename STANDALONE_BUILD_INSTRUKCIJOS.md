# 📱 Standalone iOS Build Instrukcijos
## Viršvalandžių Stebėjimo Aplikacija

---

## 🎯 Apžvalga

Ši instrukcija padės sukurti standalone iOS aplikaciją (.ipa failą), kurią galima įdiegti į iPhone be App Store.

---

## 📋 Reikalavimai

### 1. **Apple Developer Account**
- **Nemokama paskyra**: Galite testuoti 7 dienas, bet reikia kas savaitę perkompiliuoti
- **Mokama paskyra** ($99/metai): Galite naudoti TestFlight ir skelbti App Store
- Sukurkite čia: https://developer.apple.com

### 2. **Kompiuteris su macOS** (jei norite lokaliai kompiliuoti)
- Xcode įdiegtas
- arba naudokite **Expo EAS Build** (cloud kompiliavimas - rekomenduojama)

### 3. **Expo Account**
- Sukurkite čia: https://expo.dev
- Nemokama paskyra leidžia 30 build'ų per mėnesį

---

## 🚀 Metodas 1: EAS Build (Rekomenduojama - Lengviausia)

### Žingsnis 1: Įdiekite EAS CLI

```bash
npm install -g eas-cli
```

### Žingsnis 2: Prisijunkite prie Expo

```bash
eas login
```

Įveskite savo Expo paskyros duomenis.

### Žingsnis 3: Sukonfigūruokite projektą

Projekto direktorijoje (`/app/frontend/`):

```bash
cd /app/frontend
eas build:configure
```

Tai sukurs `eas.json` failą su default konfigūracija.

### Žingsnis 4: Atnaujinkite app.json

Atidarykite `/app/frontend/app.json` ir įsitikinkite, kad turite:

```json
{
  "expo": {
    "name": "Viršvalandžių Stebėjimas",
    "slug": "overtime-tracker",
    "version": "1.0.0",
    "bundleIdentifier": "com.jusuvardasarba.overtimetracker",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.jusuvardasarba.overtimetracker"
    }
  }
}
```

**SVARBU**: Pakeiskite `bundleIdentifier` į unikalų ID (pvz., `com.jusuvardasarba.overtimetracker`).

### Žingsnis 5: Sukurkite iOS Build

```bash
eas build --platform ios
```

Sistemos klausimai:
1. **"Would you like to automatically create an EAS project?"** → Paspauskite `Y`
2. **"Generate a new Apple Distribution Certificate?"** → Paspauskite `Y`
3. **"Generate a new Apple Provisioning Profile?"** → Paspauskite `Y`

### Žingsnis 6: Laukite Build Completion

Build'as vyksta Expo cloud serveriuose (~15-30 min).

Galite stebėti progresą:
```bash
eas build:list
```

arba https://expo.dev/accounts/[jūsų-username]/projects/frontend/builds

### Žingsnis 7: Atsisiųskite .ipa failą

Kai build'as baigtas, atsisiųskite `.ipa` failą iš Expo dashboard arba per:

```bash
eas build:download --platform ios
```

---

## 📲 Metodas 2: Local Build (Su Xcode - macOS būtinas)

### Žingsnis 1: Sukurkite development build

```bash
cd /app/frontend
npx expo run:ios
```

### Žingsnis 2: Atidarykite projektą Xcode

```bash
open ios/[projektopavadinimas].xcworkspace
```

### Žingsnis 3: Pasirinkite savo iPhone kaip Target

1. Prijunkite iPhone prie kompiuterio
2. Xcode viršuje pasirinkite savo įrenginį
3. Eikite į **Signing & Capabilities**
4. Pasirinkite savo **Team** (Apple Developer Account)

### Žingsnis 4: Sukurkite Archive

1. Xcode: **Product** → **Archive**
2. Laukite kompiliavimo (~5-10 min)
3. Kai baigta, **Organizer** langas atsidaro automatiškai

### Žingsnis 5: Eksportuokite .ipa

1. Pasirinkite savo archive
2. Spauskite **Distribute App**
3. Pasirinkite **Ad Hoc** arba **Development**
4. Sekite vedlio žingsnius
5. Išsaugokite `.ipa` failą

---

## 📥 Kaip Įdiegti .ipa Failą į iPhone

### Metodas A: Per Xcode (macOS)

1. Prijunkite iPhone prie kompiuterio
2. Atidarykite Xcode
3. **Window** → **Devices and Simulators**
4. Pasirinkite savo iPhone
5. Nuvilkite `.ipa` failą į **Installed Apps** skyrių

### Metodas B: Per AltStore (Be macOS)

1. Atsisiųskite **AltStore** (https://altstore.io)
2. Įdiekite AltStore į savo iPhone
3. Perkelkite `.ipa` failą į savo iPhone (per iCloud, AirDrop, etc.)
4. AltStore: Spauskite **+** → Pasirinkite `.ipa` failą
5. Įdiekite aplikaciją

**Pastaba**: AltStore reikia atnaujinti kas 7 dienas su nemokama Apple Developer paskyra.

### Metodas C: Per TestFlight (Mokama Apple Developer paskyra)

1. Xcode: **Distribute App** → **TestFlight & App Store**
2. Įkelkite į App Store Connect
3. App Store Connect: Pridėkite testers
4. Testers gauna kvietimą per TestFlight app
5. Įdiegia per TestFlight

---

## ⚙️ Backend API Konfigūracija

### Svarbu: Backend URL

Prieš build'ą, įsitikinkite, kad `/app/frontend/.env` turi teisingą backend URL:

```env
EXPO_PUBLIC_BACKEND_URL=https://jusu-serveris.com
```

**NEGALITE NAUDOTI `localhost` ar `127.0.0.1`** standalone build'e!

### Backend Deployment Opcijos:

#### Opcija 1: Railway.app
1. Sukurkite paskyrą: https://railway.app
2. Prijunkite GitHub repo
3. Deploy backend kodą
4. Gaukite public URL (pvz., `https://backend-production-xxxx.up.railway.app`)

#### Opcija 2: Render.com
1. Sukurkite paskyrą: https://render.com
2. Sukurkite naują Web Service
3. Prijunkite GitHub repo
4. Deploy ir gaukite URL

#### Opcija 3: Savo VPS Serveris
1. Nuomokite VPS (DigitalOcean, Linode, AWS EC2)
2. Įdiekite Docker
3. Deploy backend su Docker
4. Nustatykite domain arba naudokite IP su HTTPS

### Kaip Atnaujinti Backend URL:

1. Redaguokite `/app/frontend/.env`:
```env
EXPO_PUBLIC_BACKEND_URL=https://jusu-backend-url.com
```

2. Perkompiliuokite aplikaciją:
```bash
eas build --platform ios --clear-cache
```

---

## 🔧 Troubleshooting

### Klaida: "Bundle identifier has already been registered"

**Sprendimas**: Pakeiskite `bundleIdentifier` į unikalų ID:
```json
"bundleIdentifier": "com.jusuvardasarba.overtimetracker2"
```

### Klaida: "Provisioning profile expired"

**Sprendimas**: Perkurkite profile:
```bash
eas credentials
```
Pasirinkite iOS → Remove provisioning profile → Rebuild

### Klaida: "Cannot connect to backend"

**Patikrinkite**:
1. Backend URL teisingas `.env` faile
2. Backend serveris veikia (galite patikrinti naršyklėje: `https://jusu-url.com/api/`)
3. CORS nustatytas backend'e (`CORS_ORIGINS` apima jūsų domain)

### Aplikacija crashina paleidus

**Sprendimas**:
1. Patikrinkite backend URL
2. Įjunkite debug mode:
```bash
eas build --platform ios --profile development
```

---

## 📊 Build Profiles (eas.json pavyzdys)

Sukurkite `/app/frontend/eas.json`:

```json
{
  "cli": {
    "version": ">= 7.1.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "bundleIdentifier": "com.jusuvardasarba.overtimetracker"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Tipai:

- **development**: Testavimui su dev tools
- **preview**: Internal testing su realiais duomenimis
- **production**: Galutinė versija App Store

---

## 🎉 Greitas Startas (TL;DR)

```bash
# 1. Įdiekite EAS CLI
npm install -g eas-cli

# 2. Prisijunkite
cd /app/frontend
eas login

# 3. Sukonfigūruokite
eas build:configure

# 4. Atnaujinkite backend URL .env faile
# EXPO_PUBLIC_BACKEND_URL=https://jusu-backend.com

# 5. Sukurkite build
eas build --platform ios

# 6. Laukite ir atsisiųskite
eas build:download --platform ios

# 7. Įdiekite į iPhone per Xcode arba AltStore
```

---

## 📞 Papildoma Pagalba

- **Expo dokumentacija**: https://docs.expo.dev/build/introduction/
- **EAS Build**: https://docs.expo.dev/build/setup/
- **iOS Deployment**: https://docs.expo.dev/distribution/app-stores/

---

## ⚠️ Svarbūs Patarimai

1. **Backend URL**: Įsitikinkite, kad naudojate HTTPS (ne HTTP)
2. **Apple Developer**: Mokama paskyra ($99/metai) suteikia daugiau galimybių
3. **TestFlight**: Geriausias būdas distribuoti beta testers
4. **Build Time**: Pirmas build gali užtrukti 30+ min
5. **Re-signing**: Su nemokama paskyra, app galioja tik 7 dienas
6. **Cache**: Jei klaidos, naudokite `--clear-cache` flag

---

**Sėkmės kuriant aplikaciją! 🚀**
