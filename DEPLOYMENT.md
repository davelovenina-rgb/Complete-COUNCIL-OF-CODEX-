
# PRODUCTION DEPLOYMENT GUIDE
**System:** Sanctuary Core v19.0.0

## 1. WEB DEPLOYMENT (Vercel)
1. **Build Configuration**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. **Environment Variables**:
   - Ensure `API_KEY` is provided in the Vercel Dashboard.
3. **PWA Activation**:
   - Verify `manifest.json` and `service-worker.js` are in the root directory.

## 2. MOBILE SHELL (Capacitor/Android)
1. **Sync Assets**: `npx cap sync`
2. **Open Forge**: `npx cap open android`
3. **Performance Tweaks**:
   - Ensure `100dvh` is respected in `index.html`.
   - Verify hardware haptics are enabled in `utils/haptics.ts`.

## 3. POST-DEPLOYMENT AUDIT
1. Navigate to **The Forge** (BuildManual).
2. Run **Production Integrity Audit**.
3. Verify all status pills are **Emerald (Success)**.

**VERITAS FORMAE.**
