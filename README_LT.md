# Viršvalandžių Stebėjimo Aplikacija

## Aprašymas

Ši iPhone aplikacija padeda stebėti darbo laiką ir automatiš automatiškai siųsti el. laiškus su viršvalandžių informacija, kai paliekate darbo vietą.

## Pagrindinės funkcijos

### 1. **Automatinis Darbo Laiko Sekimas**
- Pradėti/sustabdyti darbo sesiją vienu mygtuku
- Realaus laiko laikmatis rodo, kiek jau dirbote
- Automatinis viršvalandžių skaičiavimas pagal įkeltą grafiką

### 2. **Foto Priminimai**
- Automatiniai priminimai fotografuoti darbą kas 15 minučių (reguliuojama)
- Vibracijos ir pyptelėjimai (10 sekundžių trukmė, reguliuojama)
- Nuotraukos saugomos vietiškai ir pridedamos prie el. laiško

### 3. **Geofencing (Vietos Sekimas)**
- Nustatykite savo darbo vietą
- Automatiškai siunčiamas el. laiškas palikus darbo zoną
- Veikia fone su "Always Allow" location leidimais

### 4. **Trijų Būdų Grafiko Įkėlimas**
- **PDF Failas**: Įkelkite PDF dokumentą - AI (Gemini 2.0) automatiškai ištraukia laikus
- **Nuotrauka (OCR)**: Nufotografuokite grafiką - AI atpažins tekstą iš nuotraukos
- **Rankinis Įvedimas**: Įveskite darbo laikus rankiniu būdu
- Viršvalandžiai skaičiuojami pagal įkeltą grafiką

### 5. **Automatinis El. Pašto Siuntimas**
- Outlook SMTP integracija
- El. laiškas su:
  - Darbo nuotraukomis
  - Viršvalandžių trukmė (valandos ir minutės)
  - Darbo pradžios ir pabaigos laikas
- Galite redaguoti temą ir gavėją

## Kaip Naudoti

### Pirmas Paleidimas

1. **Suteikite Leidimus**
   - Vietos sekimas (Always Allow) - būtinas geofencing
   - Kamera - fotografavimui
   - Pranešimai - priminimams

2. **Nustatykite Darbo Vietą**
   - Eikite į "Nustatymai"
   - Paspauskite "Nustatyti dabartinę vietą"
   - Tai nustatys 100m spindulį aplink jus kaip darbo zoną

3. **Įkelkite Darbo Grafiką**
   - Eikite į "Grafikas"
   - Pasirinkite PDF failą su darbo grafiku
   - AI automatiškai išanalizuos ir ištrauks darbo laikus

### Kasdieninis Naudojimas

1. **Pradėti Darbą**
   - Paspauskite "Pradėti darbą" pagrindiniame ekrane
   - Laikmatis pradės skaičiuoti
   - Pradės veikti automatiniai foto priminimai

2. **Fotografuoti**
   - Kai gausite priminimą, paspauskite "Fotografuoti"
   - Padarykite nuotrauką savo darbo
   - Nuotrauka automatiškai išsaugoma

3. **Baigti Darbą**
   - Paspauskite "Baigti darbą"
   - Galite iš kart išsiųsti el. laišką arba laukti automatinio siuntimo

4. **Automatinis El. Laiškas**
   - Palikus darbo zoną, automatiškai išsiunčiamas el. laiškas
   - El. laiške nurodyti viršvalandžiai ir pridėtos nuotraukos

## Nustatymai

### Priminimai
- **Intervalas**: Kas kiek minučių priminti (numatytasis: 15 min)
- **Trukmė**: Kiek sekundžių vibruoti/pyptelėti (numatytasis: 10 sek)

### El. Paštas
- **Gavėjo adresas**: Kam siųsti el. laišką
  - Testavimui: povilas999999999@yahoo.com
  - Galutinis: alvydas.vezelis@nvc.santa.lt
- **Tema**: El. laiško tema (galite redaguoti)

### Darbo Vieta
- Nustatykite geografinę darbo vietą
- 100m spindulys (fiksuotas)
- Galite pašalinti ir nustatyti iš naujo

## Istorija

- Peržiūrėkite visas praėjusias darbo sesijas
- Statistika: sesijos, išsiųsti el. laiškai, nuotraukos
- Detali informacija apie kiekvieną sesiją:
  - Dirbtas laikas
  - Viršvalandžiai
  - Nuotraukų kiekis
  - El. laiško būsena

## Techninė Informacija

### Backend
- FastAPI (Python)
- MongoDB duomenų bazė
- Emergent LLM (Gemini 2.0) PDF analizei
- Outlook SMTP el. paštui

### Frontend
- Expo React Native
- Cross-platform (iOS/Android)
- Veikia fone su expo-task-manager
- Vietos sekimas su expo-location

### El. Pašto Nustatymai
- Siuntėjas: paulius.bosas@nvc.santa.lt
- SMTP: smtp-mail.outlook.com:587

## Dažniausiai Užduodami Klausimai

**K: Kodėl reikalingas "Always Allow" vietos leidimas?**
A: Kad aplikacija galėtų stebėti, kada paliekate darbo vietą ir automatiš automatiškai siųsti el. laišką.

**K: Ar aplikacija veikia fone?**
A: Taip, geofencing ir priminimai veikia fone.

**K: Kaip keisti el. laiško gavėją?**
A: Eikite į "Nustatymai" > "El. paštas" ir pakeiskite gavėjo adresą.

**K: Ar galiu naudoti be PDF grafiko?**
A: Taip, bet viršvalandžiai nebus skaičiuojami. Sistema tik stebės bendrą dirbtą laiką.

**K: Kur saugomos nuotraukos?**
A: Nuotraukos saugomos MongoDB duomenų bazėje base64 formatu ir išsiunčiamos el. laiške.

## Palaikymas

Jei turite klausimų ar problemų, susisiekite su programuotoju.
