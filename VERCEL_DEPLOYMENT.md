# 🚀 Vercel Deployment & Live Pitch Presentation Guide

## 🌸 Angales Beauty Supplies — Enterprise Multi-Branch IMS (Pitch Demo Edition)

This guide walks you through deploying your software to Vercel in under 2 minutes so you can share a live, running link to pitch to investors, salon franchise owners, or cosmetics retail enterprises.

---

### 🌟 Key Highlights of This Pitch Demo
1. **Interactive Demo Engine**: Operates at zero latency without requiring external database servers or suffering from cold-start timeouts.
2. **1-Click Demo Role Switcher**: Presenters can switch seamlessly between **Super Admin**, **Kumasi Branch Manager**, **Accra POS Cashier**, **Inventory Officer**, and **Accountant** directly from the top banner without logging out.
3. **Rich Ghanaian Beauty Catalog**: Pre-populated with luxury beauty items (Virgin Brazilian Wigs, Olaplex No. 3, Fenty Beauty Foundation, CeraVe Cleanser, Shea Radiance Body Butter, Arabian Oud Perfumes) with real Ghanaian Cedis (`GH₵`) pricing.
4. **FEFO Expiry Telemetry**: Includes batches expiring in 12 days (critical alert) and 45 days (warning alert) to demonstrate the automated wastage prevention system.
5. **Instant Reset**: A single click on **"Reset Demo Data"** restores the demonstration back to pristine condition at any moment.

---

### 🛠️ Method 1: Deploy via GitHub (Recommended & Instant)

Because the project is already a GitHub repository (`origin: nuru2124/Angeals_beaty_supplie_inventory_system`), deploying on Vercel is 100% automated:

1. **Commit and Push your changes**:
   ```bash
   git add .
   git commit -m "feat: add Vercel deployment config, interactive pitch demo engine, and 1-click role logins"
   git push origin main
   ```

2. **Open Vercel Dashboard**:
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Sign in with your GitHub account.

3. **Import Repository**:
   - Select **`Angeals_beaty_supplie_inventory_system`** and click **Import**.

4. **Verify Build Settings** (Pre-configured automatically by `vercel.json`):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build --prefix client`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install && npm install --prefix client`

5. **Click "Deploy"**:
   - In ~45 seconds, Vercel will give you a live production URL (e.g., `https://angeals-beauty-supplies-inventory-system.vercel.app`).
   - Every future `git push origin main` will automatically redeploy!

---

### 💻 Method 2: Deploy via Vercel CLI

If you prefer deploying directly from your terminal:

```bash
# 1. Run Vercel CLI
npx vercel

# 2. Follow the prompts:
# ? Set up and deploy? -> Yes (Y)
# ? Which scope? -> [Your Account]
# ? Link to existing project? -> No (N)
# ? What's your project's name? -> angales-beauty-ims
# ? In which directory is your code located? -> ./

# 3. Deploy to production
npx vercel --prod
```

---

### 🎯 How to Pitch the Software (5-Minute Demo Flow)

| Step | Persona | What to Show / Say |
| :--- | :--- | :--- |
| **1. The Executive Overview** | 👑 Super Admin | *"Angales Beauty IMS provides multi-branch visibility across Ghana. Look at our real-time revenue, stock valuation, and low-stock alerts across Accra, Kumasi, and Takoradi."* |
| **2. The POS Experience** | 💳 POS Cashier | Click **"POS Cashier"** in the top bar. Search for *"Wig"* or *"Fenty"*, add to cart, select a VIP customer, apply a discount, choose **Mobile Money (MTN MoMo)**, click **Complete Sale**, enjoy the confetti celebration, and show the printed **Thermal Receipt** modal. |
| **3. Multi-Branch Transfers** | 📦 Inventory Officer | Click **"Inventory Officer"** in the top bar. Navigate to **Stock Transfers**. Show how Accra HQ dispatched 25 units of Olaplex & Lipsticks to Kumasi Mall with real-time transit status tracking. |
| **4. FEFO Expiry Tracking** | 📦 Inventory Officer | Navigate to **Batch & Expiry**. Point out the critical 12-day expiry alert on CeraVe cleanser batches: *"This prevents cosmetics spoilage and protects your retail margin."* |
| **5. Financials & Audit** | 📊 Accountant | Click **"Accountant"** in the top bar. Open **Expenses** and **Audit Trails**. Show that every cashier sale, transfer dispatch, and manager price change is permanently recorded with timestamps and staff names. |
