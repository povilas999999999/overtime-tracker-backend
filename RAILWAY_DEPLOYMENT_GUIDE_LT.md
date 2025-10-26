# 🚂 Railway Deployment - Žingsnis po Žingsnio

## ⚠️ Problema Kurią Sprendžiame

**Klaida Railway:**
```
Healthcheck failed!
1/1 replicas never became healthy!
```

**Pagrindinė priežastis:** MongoDB connection neegzistuoja Railway aplinkoje.

---

## ✅ SPRENDIMAS - 2 Būdai

### **BŪDAS 1: Naudoti MongoDB Atlas (REKOMENDUOJAMA)** ⭐

MongoDB Atlas yra **NEMOKAMAS** cloud MongoDB servisas.

#### **1️⃣ Sukurti MongoDB Atlas Account**

1. **Eikite į**: https://www.mongodb.com/cloud/atlas/register
2. **Užsiregistruokite** nemokamai
3. **Sukurkite naują cluster**:
   - Pasirinkite **FREE tier (M0)**
   - Region: **europe-west** (arba bet kurį EU regioną)
   - Cluster Name: `overtime-tracker`

#### **2️⃣ Gauti Connection String**

1. **Database Access**:
   - Sukurkite vartotoją (pvz., `railway_user`)
   - Passwordą išsaugokite!

2. **Network Access**:
   - Spausti **"Add IP Address"**
   - Spausti **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Tai **būtina** Railway deployment'ui

3. **Gauti Connection String**:
   - Eikite į **"Connect"** → **"Connect your application"**
   - Copy connection string:
   ```
   mongodb+srv://railway_user:<password>@overtime-tracker.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - **Pakeiskite `<password>`** savo tikru slaptažodžiu

#### **3️⃣ Railway Setup**

1. **Eikite į Railway Dashboard**: https://railway.app
2. **Pasirinkite savo project**
3. **Settings → Variables**
4. **Pridėkite Environment Variables:**

```bash
MONGO_URL=mongodb+srv://railway_user:YOUR_PASSWORD@overtime-tracker.xxxxx.mongodb.net/overtime_tracker?retryWrites=true&w=majority
DB_NAME=overtime_tracker
SENDER_EMAIL=pauliusbosas.nvc@gmail.com
SENDER_PASSWORD=afsgfbwuirqgyafg
PORT=8001
```

**SVARBU:**
- `MONGO_URL` - MongoDB Atlas connection string
- `DB_NAME` - Database pavadinimas (overtime_tracker)
- `SENDER_EMAIL` - Gmail adresas
- `SENDER_PASSWORD` - Gmail **app password** (NE paprastas slaptažodis!)
- `PORT` - Railway automatiškai nustato, bet galite palikti 8001

#### **4️⃣ Deploy Backend**

**Galite deploy'inti 2 būdais:**

**A) Per GitHub (Rekomenduojama):**
1. Push kodą į GitHub repository
2. Railway Dashboard → **"New Project"** → **"Deploy from GitHub repo"**
3. Pasirinkite savo repo
4. Railway automatiškai detect'ins Dockerfile ir deploy'ins

**B) Railway CLI:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
cd /app/backend
railway up
```

---

### **BŪDAS 2: Railway MongoDB Plugin** 🔌

Railway turi MongoDB plugin, bet jis **MOKAMAS** (po free trial).

#### **1️⃣ Pridėti MongoDB Plugin**

1. Railway Dashboard → Jūsų project
2. **"New"** → **"Database"** → **"MongoDB"**
3. Railway sukurs MongoDB instance

#### **2️⃣ Environment Variables**

Railway automatiškai sukurs `MONGO_URL` variable:
- `mongodb://mongodb:27017/railway`

Pridėkite kitas:
```bash
DB_NAME=overtime_tracker
SENDER_EMAIL=pauliusbosas.nvc@gmail.com
SENDER_PASSWORD=afsgfbwuirqgyafg
```

#### **3️⃣ Deploy**

Railway automatiškai deploy'ins kai pridėsite MongoDB plugin.

---

## 🔧 Patikrinti ar Veikia

### **1. Railway Dashboard**

- Eikite į **"Deployments"** tab
- Turėtumėte matyti **"RUNNING"** status ✅
- **Logs** turėtų rodyti:
  ```
  🚀 Starting FastAPI backend on Railway...
  🌐 Starting uvicorn on 0.0.0.0:XXXX
  INFO: Application startup complete
  ```

### **2. Test API Endpoint**

Railway suteiks jums **public URL**, pvz.:
```
https://your-app-name.railway.app
```

**Testuokite:**
```bash
curl https://your-app-name.railway.app/api/
```

**Turėtų grąžinti:**
```json
{"message": "Overtime Tracking API"}
```

---

## 🗺️ Railway Region

**Jūsų region**: `europe-west4` (Belgija) ✅

Tai **puiki vieta** Lietuvos vartotojams - mažas latency.

MongoDB Atlas turėtumėte pasirinkti:
- **europe-west** (Belgija)
- **europe-north** (Suomija)  
- Arba bet kurį EU regioną

---

## 🚨 Troubleshooting

### **Problema: "Service unavailable"**

**Sprendimas:**
1. Patikrinkite **MONGO_URL** - ar connection string teisingas?
2. Patikrinkite **MongoDB Atlas Network Access** - ar `0.0.0.0/0` allowed?
3. Pažiūrėkite Railway **Logs** - kur sustoja?

### **Problema: "Cannot connect to MongoDB"**

**Sprendimas:**
1. Testuokite connection string lokaliai:
   ```bash
   mongosh "mongodb+srv://..."
   ```
2. Jei nepavyksta - password gali būti neteisingas
3. Patikrinkite ar user turi **read/write** permissions

### **Problema: Health check fails**

**Sprendimas:**
1. Patikrinkite ar `/api/` endpoint veikia lokaliai
2. Railway laukia **100 sekundžių** - jei per ilgai kraunasi, padidinkite timeout
3. Galite išjungti health check Railway settings

---

## 📊 Backend Files Atnaujinti

✅ `/app/backend/Dockerfile` - Updated with start.sh script  
✅ `/app/backend/start.sh` - New startup script with logging  
✅ `/app/backend/railway.json` - Railway configuration  
✅ `/app/backend/requirements.txt` - Fixed dependencies

---

## 🎯 Next Steps

1. **Sukurti MongoDB Atlas account** (5 min)
2. **Gauti connection string** (2 min)
3. **Pridėti į Railway Environment Variables** (1 min)
4. **Deploy!** 🚀

---

**Data**: 2025-01-26
**Region**: europe-west4 🇧🇪
**Status**: ✅ Ready to Deploy
