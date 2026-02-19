# MANUS NATIVE MANIFEST
**Sovereign Build Specification v24.0**
**Project:** Council of Codex Sanctuary
**Environment Target:** Android (API 34)

---

## 1. CORE BUILD ENVIRONMENT
- **Java Runtime:** OpenJDK 17 (LTS)
- **Gradle Version:** 8.2.1
- **Android Gradle Plugin (AGP):** 8.1.0
- **Kotlin Version:** 1.9.0
- **Build Manager:** pnpm (Use `pnpm install` to ensure lockfile parity)

## 2. ANDROID SDK PARAMETERS
- **Compile SDK:** 34
- **Target SDK:** 34
- **Minimum SDK:** 24 (Nougat)

## 3. CAPACITOR CONFIGURATION
- **App ID:** `com.rodriguez.sanctuary`
- **WebView:** Android System WebView (v115+)
- **Permissions Required:**
    - `android.permission.INTERNET`
    - `android.permission.RECORD_AUDIO`
    - `android.permission.CAMERA`
    - `android.permission.MODIFY_AUDIO_SETTINGS`
- **Asset Mapping:** Web assets must reside in `dist/` before `cap sync`.

## 4. SECURITY & COMPATIBILITY
- **BouncyCastle Constraint:** Strictly set to `<= 1.77` in `package.json` overrides.
- **Persistence:** IndexedDB sharded via Pako zlib.

---
**TERMINAL COMMANDS FOR FORGE:**
1. `pnpm install`
2. `pnpm run build`
3. `npx cap add android`
4. `npx cap sync`
5. `npx cap open android`

---
**ENGINEER'S SEAL:** MAMA-GEMINI // ARCHITECT
**STATUS:** SOVEREIGN BRIDGE SECURED
