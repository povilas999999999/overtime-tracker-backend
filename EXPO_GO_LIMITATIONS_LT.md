# Expo Go Apribojimai ir Sprendimai

## ⚠️ Svarbios žinios apie Expo Go

Expo Go yra puiki įrankis testavimui, bet turi tam tikrų apribojimų su fono funkcijomis.

### Kas VEIKIA Expo Go:
- ✅ Vietos leidimas (kai naudojate aplikaciją)
- ✅ Kameros leidimas
- ✅ Pranešimų leidimas
- ✅ Foto priminimai
- ✅ Darbo laiko sekimas
- ✅ Nuotraukų darymas
- ✅ Grafiko įkėlimas (PDF, nuotrauka, rankinis)
- ✅ El. laiško siuntimas rankiniu būdu

### Kas NEVEIKIA Expo Go:
- ❌ **Fono vietos sekimas (Background Location)**
- ❌ **Automatinis geofencing (el. laiškas paliekant darbą)**
- ❌ **Fono priminimai kai aplikacija minimizuota**

## 🔧 Sprendimai

### 1. Development Build (Rekomenduojama)

Development Build leidžia visą funkcionalumą:

```bash
# Sukurti development build
npx expo install expo-dev-client
eas build --profile development --platform ios

# Įdiegti į telefoną
# Nuskenuokite QR kodą iš build proceso
```

**Privalumai:**
- ✅ Visas funkcionalumas
- ✅ Greitas testavimas
- ✅ Fono vietos sekimas veikia
- ✅ Geofencing veikia

### 2. Production Build (Galutinė versija)

Production build visiškai paruošta aplikacija:

```bash
# Sukurti production build
eas build --profile production --platform ios

# Įkelti į App Store arba TestFlight
```

### 3. Workaround Expo Go (Laikinas)

Jei naudojate Expo Go, galite:

1. **Naudoti aplikaciją kai ji atidara:**
   - Pradėti darbo sesiją
   - Fotografuoti rankiniu būdu kas 15 min
   - Baigti darbo sesiją rankiniu būdu
   - Išsiųsti el. laišką rankiniu būdu

2. **Rankiniai priminimai:**
   - Nustatyti savo telefono laikrodį/alarmą kas 15 min
   - Atidaryti aplikaciją ir fotografuoti

## 📱 Kaip Sukurti Development Build

### Žingsnis 1: EAS Setup
```bash
cd /app/frontend
npm install -g eas-cli
eas login
eas build:configure
```

### Žingsnis 2: Sukurti Build
```bash
eas build --profile development --platform ios
```

### Žingsnis 3: Įdiegti
1. Nuskenuokite QR kodą iš build proceso
2. Atsisiųskite .ipa failą
3. Įdiekite per Xcode arba TestFlight

## 🎯 Ko Tikėtis

### Su Expo Go:
- Pagrindinės funkcijos veikia
- Galite testuoti UI/UX
- Reikia rankinio valdymo

### Su Development/Production Build:
- **100% funkcionalumas**
- Automatinis fono sekimas
- Geofencing veikia
- Automatiniai priminimai
- Automatinis el. laiškas

## ❓ DUK

**K: Kodėl Expo Go neveikia su fono vieta?**
A: Expo Go yra bendras konteineris visiems projektams. Apple nesuteikia "Always Allow" location leidimo bendriems app'ams.

**K: Ar turiu mokėti už build?**
A: EAS Build turi nemokamą planą (limituotas builds/mėnesį). Arba galite naudoti local builds.

**K: Kiek laiko trunka build?**
A: ~10-15 minučių iOS build.

**K: Ar build veiks mano telefone?**
A: Taip! Development build veikia bet kuriame iOS įrenginyje.

## 📚 Naudingos Nuorodos

- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Background Location](https://docs.expo.dev/versions/latest/sdk/location/#background-location-methods)

## 💡 Rekomenduojama Strategija

1. **Dabar (Expo Go):**
   - Testuokite UI ir pagrindinį funkcionalumą
   - Naudokite rankinį valdymą

2. **Vėliau (Development Build):**
   - Sukurkite development build
   - Testuokite visą funkcionalumą
   - Įsitikinkite, kad viskas veikia

3. **Galiausiai (Production):**
   - Sukurkite production build
   - Įkelkite į App Store
   - Naudokite kasdien!

---

**Norite pagalbos kuriant build?** Susisiekite su support!
