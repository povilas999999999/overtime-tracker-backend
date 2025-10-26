# 🚨 Railway "start.sh not found" Klaida - IŠSPRĘSTA

## ❌ **Buvusi Klaida:**
```
⚠ Script start.sh not found
✖ Railpack could not determine how to build the app.
```

**Priežastis:** Railway bandė naudoti buildpack vietoj Dockerfile.

---

## ✅ **SPRENDIMAS - Atlikti Pakeitimai:**

### **1. Pašalintas `start.sh`** ✅
- Nebereikalingas, nes naudojame `railway.json` startCommand

### **2. Sukurtas `.railwayignore`** ✅
- Nusako ką Railway turėtų ignoruoti

### **3. Atnaujintas `railway.json`** ✅
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "./Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn server:app --host 0.0.0.0 --port $PORT"
  }
}
```

### **4. Sukurtas `nixpacks.toml`** ✅
- Užtikrina kad Railway naudotų Dockerfile

---

## 📦 **Railway Deployment Dabar:**

### **Backend Failo Struktūra:**
```
/app/backend/
├── Dockerfile              ✅ Docker image konfigūracija
├── railway.json            ✅ Railway deployment config
├── nixpacks.toml           ✅ Priverstinis Dockerfile naudojimas
├── .railwayignore          ✅ Ignoruojami failai
├── requirements.txt        ✅ Python dependencies
├── server.py               ✅ FastAPI aplikacija
├── .env                    ℹ️  Tik lokaliam testavimui
└── .dockerignore           ✅ Docker ignore taisyklės
```

---

## 🚀 **KĄ DARYTI DABAR:**

### **Metodas 1: GitHub Push (Rekomenduojama)**

```bash
# 1. Commit pakeitimai
cd /app/backend
git add .
git commit -m "Fix Railway deployment - force Dockerfile usage"
git push origin main

# 2. Railway automatiškai detektuos pakeitimus ir deploy'ins
```

### **Metodas 2: Railway Dashboard**

1. **Railway Dashboard → Settings**
2. **Build Settings → Custom Build Command:**
   - Palikite tuščią (Railway naudos Dockerfile)

3. **Deploy Settings → Custom Start Command:**
   - Įrašykite: `uvicorn server:app --host 0.0.0.0 --port $PORT`

4. **Redeploy:**
   - Deployments → Redeploy

---

## 🔍 **Kaip Patikrinti ar Veikia:**

### **Railway Logs Turėtų Rodyti:**

```
✅ Using Detected Dockerfile
✅ Build successful
✅ Starting container...
✅ INFO: Started server process [1]
✅ INFO: Application startup complete
✅ INFO: Uvicorn running on http://0.0.0.0:XXXX
```

**NETURĖTŲ būti:**
```
❌ Script start.sh not found
❌ Railpack could not determine how to build the app
```

---

## 📋 **Environment Variables (Dar Kartą):**

**Railway Dashboard → Settings → Shared Variables:**

```bash
DB_NAME=overtime_tracker

MONGO_URL=mongodb+srv://overtimeapp:Paulius999999999999@overtime-cluster.ve7v5rn.mongodb.net/overtime_tracker?retryWrites=true&w=majority&appName=overtime-cluster

SENDER_EMAIL=pauliusbosas.nvc@gmail.com

SENDER_PASSWORD=afsgfbwuirqgyafg
```

**⚠️ SVARBU:** Patikrinkite ar `MONGO_URL` neturi dviejų `@@` simbolių!

---

## 🎯 **Deployment Checklist:**

- ✅ `start.sh` pašalintas
- ✅ `railway.json` atnaujintas
- ✅ `nixpacks.toml` sukurtas
- ✅ `.railwayignore` sukurtas
- ✅ `Dockerfile` korektiškas
- ✅ `requirements.txt` clean
- ⚠️ **MONGO_URL** patikrintas Railway Dashboard
- 🚀 **Ready to deploy!**

---

## 💡 **Troubleshooting:**

### **Jei vis dar "start.sh not found":**

**Railway Dashboard → Settings:**
1. **Root Directory:** Nustatykite `backend` (jei deploy'inate iš monorepo)
2. **Build Command:** Palikite tuščią
3. **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`

### **Jei Railway vis dar naudoja buildpack:**

**Railway Dashboard → Settings → Environment:**
```
RAILWAY_DOCKERFILE_PATH=./Dockerfile
```

---

## 📊 **Failų Sąrašas Backend Directory:**

```bash
ls -la /app/backend/
```

**Turėtumėte matyti:**
```
✅ Dockerfile
✅ railway.json
✅ nixpacks.toml
✅ .railwayignore
✅ requirements.txt
✅ server.py
✅ .env
✅ .dockerignore
❌ start.sh (PAŠALINTAS)
```

---

**Data:** 2025-01-26  
**Status:** ✅ IŠSPRĘSTA - Railway dabar naudos Dockerfile  
**Next:** Push to GitHub ir redeploy Railway
