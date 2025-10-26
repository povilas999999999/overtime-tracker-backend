# 🚀 Greitas Deployment Startas

## 5 Žingsnių Kelias į Veikiančią Aplikaciją 24/7

---

### 📌 1. MongoDB (5 minutės)

1. Eikite į: **https://www.mongodb.com/cloud/atlas/register**
2. Sukurkite **FREE** M0 cluster
3. Database Access → Add User:
   - Username: `overtimeapp`
   - Password: `[sugeneruokite stiprų]`
4. Network Access → Add IP:
   - **0.0.0.0/0** (Allow from anywhere)
5. Copy connection string:
   ```
   mongodb+srv://overtimeapp:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

### 📌 2. Backend Deployment į Render (10 minučių)

1. **Render.com** → Sign up su GitHub
2. **New** → **Web Service**
3. Connect GitHub repo (backend folder)
4. Settings:
   ```
   Name: overtime-backend
   Build: pip install -r requirements.txt
   Start: uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

5. **Environment Variables**:
   ```bash
   MONGO_URL=mongodb+srv://overtimeapp:PASSWORD@cluster0.xxxxx.mongodb.net/overtime_db?retryWrites=true&w=majority
   
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SENDER_EMAIL=jusu_email@gmail.com
   EMAIL_PASSWORD=jusu_gmail_app_password
   
   EMERGENT_LLM_KEY=jusu_emergent_key
   
   CORS_ORIGINS=["*"]
   DB_NAME=overtime_tracker
   ```

6. **Gmail App Password**:
   - Google Account → Security
   - 2-Step Verification (įjunkite)
   - App passwords → Generate
   - Copy 16-character code

7. Deploy! Po 5-10 min gauksite URL:
   ```
   https://overtime-backend.onrender.com
   ```

---

### 📌 3. Frontend .env Update (2 minutės)

```bash
cd /app/frontend
```

Redaguokite `.env`:
```env
EXPO_PUBLIC_BACKEND_URL=https://overtime-backend.onrender.com
```

---

### 📌 4. iOS Build (20 minučių)

```bash
# Įdiekite EAS CLI (jei dar neturite)
npm install -g eas-cli

# Login
cd /app/frontend
eas login

# Build
eas build --platform ios

# Arba jei pirmas kartas:
eas build:configure
eas build --platform ios
```

Laukite ~15-20 min kol build baigiasi.

---

### 📌 5. Download & Install (5 minutės)

```bash
# Download .ipa
eas build:download --platform ios

# Įdiekite per:
# - Xcode (Mac)
# - AltStore (Windows/Mac)
# - TestFlight (jei turite Apple Dev)
```

---

## ✅ Testas

1. **Backend testas**:
   ```bash
   curl https://overtime-backend.onrender.com/api/
   # Turėtų grąžinti: {"message": "Overtime Tracking API"}
   ```

2. **Aplikacija iPhone**:
   - Atidarykite app
   - Eikite į Settings
   - Įveskite email settings
   - Eikite į Grafikas
   - Upload PDF → Turėtų veikti!

---

## 💰 Kaštai

| Servisas | Kaina |
|----------|-------|
| MongoDB Atlas | **Nemokama** (512MB) |
| Render Backend | **Nemokama** (750h/mėn) |
| Apple Developer | **$99/metai** (jei norite TestFlight/App Store) |
| **TOTAL** | **$0-99/metai** |

---

## 🆘 Pagalba

### Backend neveikia?
```bash
# Patikrinkite Render logs
# Dashboard → Your Service → Logs
```

### MongoDB connection failed?
- Patikrinkite IP whitelist: 0.0.0.0/0
- Patikrinkite password (be `<>` skliaustų)
- Užtikrinkite, kad connection string turi `/overtime_db`

### App negali prisijungti?
- Patikrinkite `.env` faile URL
- Rebuild app su: `eas build --platform ios --clear-cache`
- Patikrinkite CORS backend'e

---

## 📞 Support

- Visas instrukcijas: **BACKEND_DEPLOYMENT_INSTRUKCIJOS.md**
- iOS build: **STANDALONE_BUILD_INSTRUKCIJOS.md**
- iOS compatibility: **iOS_COMPATIBILITY_REPORT.md**

**Sėkmės! 🚀**
