# 🚨 Railway Deployment - KRITINĖS KLAIDOS PATAISYTOS

## ❌ **PROBLEMA RASTA:**

### **1. MONGO_URL Neteisinga Sintaksė**

**Jūsų:**
```
mongodb+srv://overtimeapp:Paulius99999999@999@overtime-cluster...
                                        ↑↑↑ DU @ SIMBOLIAI!
```

**Teisinga:**
```
mongodb+srv://overtimeapp:Paulius999999999999@overtime-cluster.ve7v5rn.mongodb.net/overtime_tracker?retryWrites=true&w=majority&appName=overtime-cluster
```

---

## ✅ **PILNAS TEISINGAS VARIABLES SĄRAŠAS:**

**Railway → Settings → Shared Variables:**

```bash
DB_NAME=overtime_tracker

MONGO_URL=mongodb+srv://overtimeapp:Paulius999999999999@overtime-cluster.ve7v5rn.mongodb.net/overtime_tracker?retryWrites=true&w=majority&appName=overtime-cluster

SENDER_EMAIL=pauliusbosas.nvc@gmail.com

SENDER_PASSWORD=afsgfbwuirqgyafg
```

---

## 📝 **KĄ DARYTI DABAR:**

### **1. Pakeisti MONGO_URL** 

Railway Dashboard:
1. **Settings → Shared Variables**
2. **Raskite `MONGO_URL`**
3. **Ištrinkite seną value**
4. **Įklijuokite naują:**
   ```
   mongodb+srv://overtimeapp:Paulius999999999999@overtime-cluster.ve7v5rn.mongodb.net/overtime_tracker?retryWrites=true&w=majority&appName=overtime-cluster
   ```
5. **Spauskite checkmark (✓) arba Save**

---

### **2. Patikrinti Kitus Variables**

Įsitikinkite kad:
- ✅ `DB_NAME` = `overtime_tracker`
- ✅ `SENDER_EMAIL` = `pauliusbosas.nvc@gmail.com`
- ✅ `SENDER_PASSWORD` = `afsgfbwuirqgyafg`

---

### **3. Deploy**

**A) Automatinis Deploy:**
Railway turėtų automatiškai re-deploy'inti po variables pakeitimo.

**B) Rankinis Deploy (jei automatinis neveikia):**
1. **Deployments** tab
2. **"Redeploy"** arba **"Deploy Latest"** mygtukas

---

## 🔍 **KAIP PATIKRINTI AR VEIKIA:**

### **1. Railway Logs**

Eikite į **Deployments → Logs**

**Turėtumėte matyti:**
```
🚀 Starting on port 8001
INFO:     Started server process [XXX]
INFO:     Application startup complete
```

**NETURĖTUMĖTE matyti:**
```
pymongo.errors.ConfigurationError
ServerSelectionTimeoutError
```

---

### **2. Test API**

Railway suteiks public URL, pvz.:
```
https://your-app.railway.app
```

**Testuokite:**
```bash
curl https://your-app.railway.app/api/
```

**Turėtų grąžinti:**
```json
{"message": "Overtime Tracking API"}
```

---

## 🎯 **PAGRINDINĖ PROBLEMA:**

**MongoDB URL formatas:**
```
mongodb+srv://username:password@host/database?parameters
                       ↑ TIK VIENAS @ SIMBOLIS!
```

**Jūsų slaptažodis:** `Paulius999999999999` (15 devynių)
**NEGALIMA:** `Paulius99999999@999@` (su extra @ simboliais)

---

## 📦 **FAILAI ATNAUJINTI:**

✅ `/app/backend/Dockerfile` - Simplified CMD  
✅ `/app/backend/railway.json` - Railway config  
✅ `/app/backend/requirements.txt` - Fixed dependencies

---

**Kai pakeiste MONGO_URL ir re-deploy'inote, backend turėtų startuoti sėkmingai!**

**Data:** 2025-01-26  
**Status:** ✅ Dockerfile pataisytas, laukiama MONGO_URL pataisymo
