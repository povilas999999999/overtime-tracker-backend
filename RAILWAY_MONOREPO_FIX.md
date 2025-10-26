# 🚂 Railway Monorepo Fix - GALUTINIS SPRENDIMAS

## ❌ **Problema:**
```
⚠ Script start.sh not found
✖ Railpack could not determine how to build the app
```

**Priežastis:** Railway žiūri į root directory (`/app`), bet Dockerfile yra `backend/` subdirektorijoje.

---

## ✅ **SPRENDIMAS - 3 Būdai (Pasirinkite VIENĄ):**

### **BŪDAS 1: Railway Dashboard "Root Directory" (GERIAUSIAS)** ⭐

**Railway Dashboard → Settings → General:**

```
Root Directory: backend
```

**Kaip nustatyti:**
1. Atidarykite Railway Dashboard
2. Pasirinkite savo project
3. **Settings** → **General**
4. **Root Directory** laukelyje įrašykite: `backend`
5. **Save** pakeitimus
6. Eikite į **Deployments** → **Redeploy**

✅ **Pranašumai:**
- Paprasčiausias būdas
- Railway matys tik `backend/` directory
- Visi path'ai bus teisingi

---

### **BŪDAS 2: Environment Variable**

**Railway Dashboard → Settings → Variables:**

Pridėkite:
```
RAILWAY_DOCKERFILE_PATH=backend/Dockerfile
```

**Kaip nustatyti:**
1. **Settings** → **Variables**
2. **New Variable**
3. Key: `RAILWAY_DOCKERFILE_PATH`
4. Value: `backend/Dockerfile`
5. **Save**
6. **Redeploy**

---

### **BŪDAS 3: Dockerfile Root Directory (ATLIKTA)** ✅

**Jau padaryta jums:**
- ✅ Dockerfile nukopijuotas į `/app/Dockerfile`
- ✅ railway.json nukopijuotas į `/app/railway.json`
- ✅ Dockerfile pakeistas kopijuoti iš `backend/` direktorijos

**Dabar Dockerfile atrodo taip:**
```dockerfile
# Copy requirements from backend directory
COPY backend/requirements.txt .

# Copy application code from backend directory
COPY backend/ .
```

✅ **Pranašumai:**
- Nedelsiant veikia
- Nereikia keisti Railway settings
- Push į GitHub ir deploy

❌ **Trūkumai:**
- Turi 2 Dockerfile (root ir backend/)
- Reikia sinchronizuoti jei keičiate

---

## 🚀 **KĄ DARYTI DABAR:**

### **Su BŪDU 3 (Dockerfile root):**

**1. Push pakeitimus į GitHub:**
```bash
cd /app
git add .
git commit -m "Fix Railway monorepo - add root Dockerfile"
git push origin main
```

**2. Railway automatiškai deploy'ins!**

Railway dabar matys:
```
✅ Found Dockerfile in root
✅ Using Detected Dockerfile
✅ Build starting...
```

---

## 📦 **Railway Environment Variables (Būtina!):**

**Railway Dashboard → Settings → Shared Variables:**

```bash
DB_NAME=overtime_tracker

MONGO_URL=mongodb+srv://overtimeapp:Paulius999999999999@overtime-cluster.ve7v5rn.mongodb.net/overtime_tracker?retryWrites=true&w=majority&appName=overtime-cluster

SENDER_EMAIL=pauliusbosas.nvc@gmail.com

SENDER_PASSWORD=afsgfbwuirqgyafg
```

**⚠️ SVARBU:**
- Patikrinkite MONGO_URL - **vienas `@`** simbolis!
- Ne `Paulius99999999@999@` (dvigubas @)
- Turi būti `Paulius999999999999@` (vienas @)

---

## 🔍 **Tikėtini Railway Logs:**

**Build Phase:**
```
✅ Using Detected Dockerfile
✅ [1/6] FROM docker.io/library/python:3.11-slim
✅ [2/6] WORKDIR /app
✅ [3/6] RUN apt-get update && apt-get install gcc
✅ [4/6] COPY backend/requirements.txt .
✅ [5/6] RUN pip install -r requirements.txt
✅ [6/6] COPY backend/ .
✅ Build successful
```

**Deploy Phase:**
```
✅ Starting container...
✅ INFO: Started server process [1]
✅ INFO: Waiting for application startup
✅ INFO: Application startup complete
✅ INFO: Uvicorn running on http://0.0.0.0:XXXX
```

---

## 🎯 **Deployment Checklist:**

- ✅ Dockerfile root directory created
- ✅ railway.json root directory created
- ✅ Dockerfile pakeistas kopijuoti iš `backend/`
- ⚠️ **MONGO_URL patikrintas Railway Dashboard**
- ⚠️ **Visi Variables išsaugoti Railway**
- 🚀 **Push į GitHub**
- 🚀 **Railway Redeploy**

---

## 💡 **Troubleshooting:**

### **Jei vis dar "start.sh not found":**

**Patikrinkite Railway Settings:**
1. **Root Directory** - ar nustatyta `backend`? (jei naudojate BŪDĄ 1)
2. **Watch Paths** - palikite tuščią arba `**`
3. **Build Command** - palikite tuščią
4. **Start Command** - įrašykite: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### **Jei "Cannot find module server":**

Įsitikinkite, kad:
- ✅ `COPY backend/ .` nukopijuoja `server.py` į `/app/`
- ✅ `WORKDIR /app` nustatyta

### **Jei MongoDB Connection Error:**

Patikrinkite:
- ✅ MONGO_URL turi **viena `@`** simbolį
- ✅ MONGO_URL turi `/overtime_tracker` database pavadinimą
- ✅ MongoDB Atlas Network Access leidžia `0.0.0.0/0`

---

## 📊 **Failo Struktūra Dabar:**

```
/app/
├── Dockerfile              ✅ ROOT - kopijuoja iš backend/
├── railway.json            ✅ ROOT - Railway config
├── backend/
│   ├── Dockerfile          ✅ Original (lokaliam dev)
│   ├── railway.json        ✅ Original
│   ├── requirements.txt    ✅
│   ├── server.py           ✅
│   └── .env                ℹ️  Local only
└── frontend/
    └── ...
```

---

## 🎉 **SUMMARY:**

**Pakeitimai atlikti:**
1. ✅ Dockerfile sukurtas root directory
2. ✅ railway.json nukopijuotas root
3. ✅ Dockerfile pakeistas kopijuoti iš `backend/`

**Kas reikia padaryti:**
1. ⚠️ Patikrinti MONGO_URL Railway Dashboard (vienas @)
2. 🚀 Push į GitHub
3. 🚀 Railway redeploy

**Tikimasi:**
- ✅ Build successful
- ✅ Deploy successful
- ✅ API veikia: `https://your-app.railway.app/api/`

---

**Data:** 2025-01-26  
**Status:** ✅ PARUOŠTA DEPLOYMENT  
**Next:** Push & Deploy!
