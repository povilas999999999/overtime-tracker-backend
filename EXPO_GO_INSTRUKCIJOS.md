# 📱 Expo Go Telefone - Instrukcijos

## ⚠️ Problema
Telefone rodoma klaida: `trackmyhours-2.ngrok.io is offline`

Tai yra **senas adresas** iš prieš fork operacijos.

---

## ✅ Sprendimas

### Metodas 1: Rankinis URL Įvedimas (Rekomenduojama)

1. **Atidarykite Expo Go** aplikaciją telefone
2. **Įveskite šį URL rankiniu būdu**:
   ```
   exp://trackmyhours-2.preview.emergentagent.com
   ```

3. **Arba bandykite su HTTP**:
   ```
   http://trackmyhours-2.preview.emergentagent.com
   ```

### Metodas 2: Išvalykite Expo Go Cache

1. Atidarykite Expo Go
2. Eikite į **Settings** (nustatymai)
3. Paspauskite **Clear cache**
4. Pabandykite nuskaityti QR kodą iš naujo

### Metodas 3: Naudokite Web Preview

Jei Expo Go neveikia, galite naudoti **web versiją**:

```
https://trackmyhours-2.preview.emergentagent.com
```

Atidarykite šį URL telefono naršyklėje.

---

## 🔧 Techniniai Detailai

**Dabartinė konfigūracija:**
- Frontend URL: `https://trackmyhours-2.preview.emergentagent.com`
- Backend URL: `https://trackmyhours-2.preview.emergentagent.com/api`
- Expo Tunelis: ✅ Veikia
- Metro Bundler: ✅ Veikia

**Sena (neteisinga) konfigūracija:**
- ❌ `trackmyhours-2.ngrok.io` (nebegalioja)

---

## 📝 Pastabos

- QR kodai gali būti cache'inti telefone
- Po fork operacijos URLs pasikeičia
- Visada naudokite naujausius URLs iš `.env` failo

---

**Generavimo laikas**: 2025-01-26
**Status**: ✅ Backend ir Frontend veikia teisingai
