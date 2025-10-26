# 📊 Kaip Įkelti Darbo Grafiką per Excel/CSV/TXT

## 🎯 Nauja Funkcija!

Dabar galite įkelti darbo grafiką kaip **Excel, CSV arba TXT failą** vietoj PDF!

---

## 📸 Žingsnis 1: Nufotografuokite Grafiką

1. Atidarykite savo darbo grafiką
2. Nufotografuokite telefonu (aiškiai!)
3. Išsaugokite nuotrauką

---

## 🤖 Žingsnis 2: Naudokite ChatGPT

### Variantas A: ChatGPT (Rekomenduojama)

1. **Eikite į**: https://chat.openai.com
2. **Įkelkite nuotrauką** (drag & drop arba 📎 mygtukas)
3. **Įrašykite šį prompt'ą**:

```
Prašau ištraukti darbo grafiką iš šios nuotraukos ir sukurti CSV failą.

Formatas:
- Stulpelis 1: Data (YYYY-MM-DD formatu)
- Stulpelis 2: Darbo pradžia (HH:MM formatu)
- Stulpelis 3: Darbo pabaiga (HH:MM formatu)

Pavyzdys:
date,start,end
2025-10-14,07:30,15:30
2025-10-15,07:30,16:00

Praleiskite dienas su P, M, A, BN žymėmis (tai ne darbo dienos).
Grąžinkite tik CSV turinį be papildomo teksto.
```

4. **ChatGPT sugeneruos CSV**:
```csv
date,start,end
2025-10-01,07:30,15:30
2025-10-02,07:30,14:00
2025-10-03,07:30,16:30
```

5. **Copy-paste** į Notepad arba Excel
6. **Išsaugokite kaip**:
   - `.csv` failą (rekomenduojama)
   - `.txt` failą
   - `.xlsx` failą (Excel)

---

### Variantas B: Google Gemini

1. **Eikite į**: https://gemini.google.com
2. **Įkelkite nuotrauką**
3. **Naudokite tą patį prompt'ą**
4. **Išsaugokite rezultatą**

---

### Variantas C: Claude AI

1. **Eikite į**: https://claude.ai
2. **Įkelkite nuotrauką**
3. **Naudokite tą patį prompt'ą**
4. **Išsaugokite rezultatą**

---

## 📱 Žingsnis 3: Įkelkite į Aplikaciją

1. **Atidarykite** Viršvalandžių Stebėjimo programėlę
2. **Eikite** į **Grafikas** ekraną
3. **Spauskite** "Pasirinkti Metodą"
4. **Pasirinkite** "Excel/CSV/TXT Failas"
5. **Įkelkite** jūsų sukurtą failą
6. ✅ **Patvirtinimas**: Matysite "Rastos X darbo dienos"

---

## 📋 Palaikomi Failų Formatai

### 1. CSV (Comma-Separated Values) ✅ Rekomenduojama

```csv
date,start,end
2025-10-14,07:30,15:30
2025-10-15,08:00,16:00
2025-10-16,07:30,14:30
```

**Kaip sukurti**:
- Notepad → Paste → Save As → `grafikas.csv`
- Excel → Save As → CSV (Comma delimited)

---

### 2. TXT (Plain Text)

```txt
2025-10-14,07:30,15:30
2025-10-15,08:00,16:00
2025-10-16,07:30,14:30
```

**Kaip sukurti**:
- Notepad → Paste → Save As → `grafikas.txt`

**Pastaba**: Kiekviena eilutė turi būti: `data,pradžia,pabaiga`

---

### 3. Excel (.xlsx arba .xls)

| date       | start | end   |
|------------|-------|-------|
| 2025-10-14 | 07:30 | 15:30 |
| 2025-10-15 | 08:00 | 16:00 |
| 2025-10-16 | 07:30 | 14:30 |

**Kaip sukurti**:
1. Atidarykite Excel
2. Sukurkite 3 stulpelius: `date`, `start`, `end`
3. Įveskite duomenis
4. Save As → `.xlsx`

---

## ✅ Formato Reikalavimai

### Data:
- ✅ Teisingai: `2025-10-14` (YYYY-MM-DD)
- ❌ Blogai: `14/10/2025`, `14.10.2025`, `Oct 14`

### Laikas:
- ✅ Teisingai: `07:30`, `15:00`, `08:45`
- ❌ Blogai: `7:30`, `15`, `8.45`

### CSV/TXT:
- Naudokite kablelį `,` kaip separatorių
- Pirma eilutė gali būti header: `date,start,end`
- Arba iškart duomenys

---

## 🔧 Troubleshooting

### Klaida: "No valid schedule data found"

**Problema**: Failas tuščias arba blogai formatuotas

**Sprendimas**:
1. Patikrinkite, kad data formatas: `YYYY-MM-DD`
2. Patikrinkite, kad laikas formatas: `HH:MM`
3. CSV - naudokite kablelį `,` ne kabliataškį `;`
4. Įsitikinkite, kad failas turi bent vieną eilutę

---

### Klaida: "Could not identify date, start, and end columns"

**Problema**: Excel/CSV stulpeliai neturi tinkamų pavadinimų

**Sprendimas**:
Pirmoje eilutėje įrašykite header:
```csv
date,start,end
```

Arba naudokite lietuviškus:
```csv
data,pradžia,pabaiga
```

Arba angliškus:
```csv
date,start time,end time
```

---

### Klaida: "Unsupported file type"

**Problema**: Bandote įkelti nepalaik

omą failą (pvz., PNG, JPG, PDF)

**Sprendimas**:
- Naudokite tik: `.xlsx`, `.xls`, `.csv`, `.txt`
- Jei turite PDF - naudokite ChatGPT konvertuoti į CSV

---

## 💡 Patarimai

### 1. **Naudokite ChatGPT Plus** (jei turite):
- Geresnė OCR (optical character recognition)
- Tikslesnė data/laiko ekstrakcija
- Greičiau

### 2. **Aiški nuotrauka**:
- Geras apšvietimas
- Neryški nuotrauka
- Grafiko laukai aiškiai matomi

### 3. **Patikrinkite duomenis**:
- Po to kai ChatGPT sugeneruoja, perskaitykite
- Patikrinkite ar visos datos teisingos
- Patikrinkite ar visi laikai teisingi

### 4. **Išsaugokite šabloną**:
- Kai sukuriate pirmą kartą, išsaugokite kaip šabloną
- Kitą mėnesį tiesiog pakeiskite datas
- Copy-paste ir keiskite tik reikalingus laukus

---

## 📖 Pavyzdžiai

### Pavyzdys 1: Pilnas mėnesio grafikas (CSV)

```csv
date,start,end
2025-11-01,07:30,15:30
2025-11-04,07:30,16:00
2025-11-05,08:00,15:00
2025-11-06,07:30,14:30
2025-11-07,07:00,15:00
2025-11-08,07:30,15:30
2025-11-11,08:00,16:00
2025-11-12,07:30,15:30
2025-11-13,07:00,14:00
2025-11-14,07:30,16:30
2025-11-15,08:00,15:00
```

---

### Pavyzdys 2: Su komentarais (TXT)

```txt
# Lapkričio mėnesio grafikas
# P, M - poilsio dienos, praleidžiame
2025-11-01,07:30,15:30
2025-11-04,07:30,16:00
2025-11-05,08:00,15:00
# 2025-11-06 ir 2025-11-07 - savaitgalis
2025-11-08,07:30,15:30
```

**Pastaba**: Eilutės su `#` bus praleistos

---

### Pavyzdys 3: Excel su antraštėmis

| Data       | Pradžia | Pabaiga | Pastabos |
|------------|---------|---------|----------|
| 2025-11-01 | 07:30   | 15:30   | Pirmadienis |
| 2025-11-04 | 07:30   | 16:00   | Ketvirtadienis |
| 2025-11-05 | 08:00   | 15:00   | Penktadienis |

**Pastaba**: "Pastabos" stulpelis bus ignoruojamas, naudojami tik pirmi 3

---

## 🚀 Greitas Startas (TL;DR)

```
1. Nufotografuokite grafiką 📸
2. ChatGPT → Įkelkite foto → "Extract to CSV"
3. Copy rezultatą → Notepad → Save As grafikas.csv
4. Programėlė → Grafikas → Pasirinkti Metodą → Excel/CSV/TXT
5. Pasirinkite grafikas.csv → ✅ Done!
```

---

## ❓ Klausimai?

Jei kyla problemų:
1. Patikrinkite formato pavyzdžius viršuje
2. Bandykite CSV formatą (paprasčiausias)
3. Įsitikinkite, kad datos ir laikai teisingi

**Tai daug paprasčiau nei PDF parsing, nes nereikia AI - tiesiog paprasti failai! 🎉**
