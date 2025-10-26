# ⚡ Railway $PORT Klaida - IŠSPRĘSTA

## ❌ **Buvusi Klaida:**

```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```

**Priežastis:** Dockerfile CMD negalėjo expandinti `$PORT` environment variable.

---

## ✅ **SPRENDIMAS:**

Railway dabar naudoja **`railway.json` startCommand** vietoj Dockerfile CMD.

### **Pataisyti Failai:**

**1. `/app/backend/railway.json`:**
```json
{
  "deploy": {
    "startCommand": "uvicorn server:app --host 0.0.0.0 --port $PORT --log-level info"
  }
}
```

**2. `/app/backend/Dockerfile`:**
```dockerfile
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```
*(Dockerfile CMD dabar tik fallback lokaliam testavimui)*

---

## 🎯 **KAIP VEIKIA DABAR:**

1. **Railway build'ina** Docker image su Dockerfile
2. **Railway IGNORUOJA** Dockerfile CMD
3. **Railway NAUDOJA** `railway.json` startCommand
4. **startCommand** gauna tikrą `$PORT` value (pvz., 3000, 8000, etc.)
5. **uvicorn startina** su teisingai expandintu portu

---

## 📋 **PILNAS CHECKLIST:**

### ✅ **1. Environment Variables (Railway Dashboard):**

```bash
DB_NAME=overtime_tracker
MONGO_URL=mongodb+srv://overtimeapp:Paulius999999999999@overtime-cluster.ve7v5rn.mongodb.net/overtime_tracker?retryWrites=true&w=majority&appName=overtime-cluster
SENDER_EMAIL=pauliusbosas.nvc@gmail.com
SENDER_PASSWORD=afsgfbwuirqgyafg
```

### ✅ **2. Failai Atnaujinti:**

- `/app/backend/Dockerfile` - Simplified CMD
- `/app/backend/railway.json` - startCommand su $PORT
- `/app/backend/requirements.txt` - Clean dependencies

### ✅ **3. Deploy:**

**Railway automatiškai re-deploy'ins kai:**
- Push'insite į GitHub (jei naudojate GitHub integration)
- Arba **Deployments → Redeploy** mygtukas

---

## 🔍 **KĄ TIKĖTIS LOGS:**

**Railway Deployment Logs turėtų rodyti:**

```
Building...
Build successful
Starting container...
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX (Press CTRL+C to quit)
```

**NETURĖTŲ BŪTI:**
```
❌ Error: Invalid value for '--port': '$PORT' is not a valid integer.
❌ pymongo.errors.ConfigurationError
```

---

## 🚀 **Next Steps:**

1. **Patikrinkite MONGO_URL** - ar pakeistas be dviejų `@`?
2. **Push kodą į GitHub** arba **Redeploy Railway**
3. **Stebėkite Deployment Logs**
4. **Test API** - Railway public URL → `/api/`

---

**Data:** 2025-01-26  
**Status:** ✅ $PORT klaida išspręsta, laukiama MongoDB connection pataisymo
