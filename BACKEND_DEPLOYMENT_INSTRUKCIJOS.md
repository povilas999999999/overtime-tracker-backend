# 🚀 Backend Deployment Instrukcijos
## FastAPI Serverio Deployment į Railway ir Render

---

## 📋 Apžvalga

Šios instrukcijos padės jums deploy'inti FastAPI backend serverį, kad jis veiktų 24/7 ir būtų prieinamas jūsų iPhone aplikacijai.

---

## 🎯 Pasirinkite Platformą

| Platforma | Kaina | Privalumai | Trūkumai |
|-----------|-------|------------|----------|
| **Railway** | $5/mėn arba $0.10/valandą | Labai paprasta, automatinis deploy | Nėra free tier (500h/mėn trial) |
| **Render** | Nemokama | 750h/mėn nemokama | Lėtesnis cold start |

**Rekomendacija**: Pradėkite su **Render** (nemokama), vėliau galite pereiti į Railway.

---

# 📦 Metodas 1: Deployment į Render.com (Rekomenduojama)

## Žingsnis 1: Paruoškite MongoDB

### Variantas A: MongoDB Atlas (Nemokama - Rekomenduojama)

1. **Eikite į**: https://www.mongodb.com/cloud/atlas/register
2. **Sukurkite paskyrą** (nemokama)
3. **Sukurkite naują cluster**:
   - Pasirinkite **FREE** (M0) tier
   - Pasirinkite **AWS** provider
   - Pasirinkite **Region** (rekomenduojama: us-east-1)
   - Spauskite **Create Cluster**

4. **Sukurkite Database User**:
   - Security → Database Access
   - Add New Database User
   - Username: `overtimeapp`
   - Password: **Sugeneruokite stiprų slaptažodį** (išsaugokite!)
   - Roles: **Read and write to any database**

5. **Leiskite Network Access**:
   - Security → Network Access
   - Add IP Address
   - Pasirinkite: **Allow Access from Anywhere** (0.0.0.0/0)
   - Arba: Pridėkite Render IP ranges

6. **Gaukite Connection String**:
   - Overview → Connect
   - Connect your application
   - Copy connection string:
   ```
   mongodb+srv://overtimeapp:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - **SVARBU**: Pakeiskite `<password>` į tikrą slaptažodį!

### Variantas B: Render MongoDB (Mokama - $7/mėn)

Render taip pat siūlo managed MongoDB, bet tai yra mokama paslauga.

---

## Žingsnis 2: Deploy'inimas į Render

### 2.1. Sukurkite Render Paskyrą

1. Eikite į: https://render.com
2. Sign Up su GitHub paskyra (rekomenduojama)
3. Patvirtinkite email

### 2.2. Paruoškite Backend Kodą GitHub

**Jei dar neturite GitHub repo:**

```bash
cd /app/backend

# Inicializuokite git
git init

# Pridėkite .gitignore
cat > .gitignore << EOF
__pycache__/
*.pyc
*.pyo
.env
*.log
EOF

# Commit visus failus
git add .
git commit -m "Initial backend commit"

# Sukurkite GitHub repo ir push'inkite
# (GitHub.com → New Repository → overtime-backend)
git remote add origin https://github.com/YOUR_USERNAME/overtime-backend.git
git branch -M main
git push -u origin main
```

### 2.3. Sukurkite Web Service Render

1. **Render Dashboard** → **New** → **Web Service**

2. **Connect Repository**:
   - Pasirinkite jūsų GitHub repo (overtime-backend)
   - Spauskite **Connect**

3. **Konfigūruokite Service**:
   ```yaml
   Name: overtime-tracker-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: (palikite tuščią, jei backend root'e)
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

4. **Pasirinkite Plan**:
   - **Free** (750 hours/month)
   - Aplikacija "užmigs" po 15 min neaktyvumo
   - Cold start: ~30 sekundžių

5. **Environment Variables** (Labai svarbu!):
   
   Spauskite **Advanced** → **Add Environment Variable**
   
   Pridėkite šias kintamąsias:

   ```bash
   # MongoDB (PRIVALOMA)
   MONGO_URL=mongodb+srv://overtimeapp:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/overtime_db?retryWrites=true&w=majority
   
   # Email SMTP (Gmail)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SENDER_EMAIL=jusu_email@gmail.com
   EMAIL_PASSWORD=jusu_app_password  # Gmail App Password!
   
   # LLM Integration (Emergent Key)
   EMERGENT_LLM_KEY=jusu_emergent_key
   
   # CORS (Svarbu!)
   CORS_ORIGINS=["*"]  # Arba konkretūs domains
   ```

   **Gmail App Password Gavimas**:
   - Google Account → Security
   - 2-Step Verification (įjunkite jei neįjungta)
   - App passwords → Generate
   - Pasirinkite: Mail → Other (Custom name)
   - Copy 16-character password

6. **Spauskite**: **Create Web Service**

### 2.4. Laukite Deploy Completion

- Deploy procesas užtruks ~5-10 minučių
- Galite stebėti logs realiu laiku
- Kai pabaigs, pamatysite: **Live** 🟢

### 2.5. Gaukite Backend URL

Render suteiks URL:
```
https://overtime-tracker-backend.onrender.com
```

**Testuokite API**:
```bash
curl https://overtime-tracker-backend.onrender.com/api/
# Turėtų grąžinti: {"message": "Overtime Tracking API"}
```

---

# 🚂 Metodas 2: Deployment į Railway.app

## Žingsnis 1: Sukurkite Railway Paskyrą

1. Eikite į: https://railway.app
2. Sign Up su GitHub
3. Verify email

## Žingsnis 2: Sukurkite Projektą

1. **Railway Dashboard** → **New Project**
2. Pasirinkite: **Deploy from GitHub repo**
3. Pasirinkite jūsų backend repository

## Žingsnis 3: Pridėkite MongoDB

1. **Projektė** → **New** → **Database** → **Add MongoDB**
2. Railway automatiškai sukurs MongoDB instance
3. Connection string bus automatiškai pridėtas kaip `MONGO_URL`

## Žingsnis 4: Konfigūruokite Environment Variables

1. Pasirinkite jūsų service
2. **Variables** tab
3. Pridėkite:

```bash
# Email SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=jusu_email@gmail.com
EMAIL_PASSWORD=jusu_gmail_app_password

# LLM Integration
EMERGENT_LLM_KEY=jusu_emergent_key

# CORS
CORS_ORIGINS=["*"]

# MongoDB (jau turėtų būti automatiškai)
MONGO_URL=${{MongoDB.MONGO_URL}}
```

## Žingsnis 5: Deploy

1. Railway automatiškai detect'ins Dockerfile
2. Build ir deploy prasidės automatiškai
3. Po ~5 minučių bus live

## Žingsnis 6: Gaukite URL

1. **Settings** → **Networking** → **Generate Domain**
2. Railway suteiks:
   ```
   https://overtime-backend-production.up.railway.app
   ```

---

# 📱 Žingsnis 3: Atnaujinkite iOS App su Backend URL

## 3.1. Atnaujinkite Frontend .env

```bash
cd /app/frontend
```

Redaguokite `.env` failą:

```env
# Pakeiskite į tikrą deployed backend URL
EXPO_PUBLIC_BACKEND_URL=https://overtime-tracker-backend.onrender.com

# Arba Railway:
# EXPO_PUBLIC_BACKEND_URL=https://overtime-backend-production.up.railway.app

# Kiti settings (palikite kaip yra)
EXPO_PACKAGER_PROXY_URL=http://127.0.0.1:19000
EXPO_PACKAGER_HOSTNAME=127.0.0.1
```

## 3.2. Perkompiliuokite iOS App

```bash
# Išvalykite cache
rm -rf node_modules/.cache
rm -rf .expo

# Build naują versiją
eas build --platform ios --clear-cache
```

---

# 🔧 Troubleshooting

## Klaida: "CORS Error"

**Sprendimas**: Backend'e įsitikinkite, kad CORS leidžia jūsų domain:

```python
# server.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Arba ["https://your-app.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Klaida: "MongoDB Connection Failed"

**Patikrinkite**:
1. MONGO_URL environment variable teisingas
2. MongoDB Atlas IP whitelist turi 0.0.0.0/0
3. Database user password teisingas (be `<>` skliaustų)

## Klaida: "Service Sleeping" (Render Free Tier)

**Normalus elgesys**:
- Free tier užmiega po 15 min neaktyvumo
- Pirmas request po užmigimo užtrunka ~30 sek

**Sprendimas**:
- Upgrade į paid plan ($7/mėn)
- Arba naudokite cron job keep-alive:
  ```bash
  # Pinginkite kas 10 min
  */10 * * * * curl https://your-backend.onrender.com/api/
  ```

## Klaida: "Email Sending Failed"

**Patikrinkite**:
1. Gmail App Password (ne regular password!)
2. SMTP_SERVER ir SMTP_PORT teisingi
3. 2-Factor Authentication įjungta Gmail

---

# 📊 Monitoring ir Logs

## Render:
- Dashboard → Your Service → **Logs** tab
- Real-time logs
- Galite filter'inti pagal severity

## Railway:
- Project → Service → **Deployments** → **View Logs**
- Real-time logs su search

---

# 💰 Kainų Palyginimas

## Render Free Tier:
```
✅ 750 valandų/mėn nemokama (31.25 dienos)
✅ 512MB RAM
✅ Automatinis HTTPS
❌ Sleeps po 15min inactivity
❌ Cold starts ~30 sek

Upgrade: $7/mėn (Always on, 512MB RAM)
```

## Railway:
```
✅ $5 credit/mėn trial
✅ Po trial: $5/mėn (Hobby plan)
✅ 512MB RAM, 1GB storage
✅ Always on
✅ Fast cold starts
❌ Nėra tikro free tier

Po trial: ~$5-10/mėn priklausomai nuo usage
```

## MongoDB Atlas:
```
✅ 512MB storage nemokama
✅ Shared cluster
✅ Always on

Upgrade: $9/mėn (Dedicated cluster, 2GB RAM)
```

---

# ✅ Deployment Checklist

## Backend:
- [ ] MongoDB Atlas sukurtas ir veikia
- [ ] MONGO_URL connection string teisingas
- [ ] Backend deployed į Render/Railway
- [ ] Visi environment variables nustatyti
- [ ] Backend API testas veikia: `curl https://your-backend.com/api/`
- [ ] Gmail App Password sukurtas ir veikia
- [ ] CORS leidžia frontend domain

## Frontend:
- [ ] `.env` atnaujintas su backend URL
- [ ] Cache išvalytas
- [ ] Naujas iOS build sukurtas
- [ ] App testuoja su deployed backend

---

# 🎉 Sėkmės Kriterijai

✅ Backend API atsako: `https://your-backend.com/api/`  
✅ MongoDB prisijungimas veikia  
✅ PDF schedule upload veikia  
✅ Email sending veikia  
✅ Location tracking veikia  
✅ Notifications veikia  
✅ iOS app jungiasi prie backend 24/7  

---

# 📞 Pagalba

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment

---

**Backend serveris dabar veiks 24/7 ir jūsų iPhone aplikacija galės jungtis iš bet kur! 🚀📱**