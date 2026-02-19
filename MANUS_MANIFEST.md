# MANUS NATIVE MANIFEST
**Sovereign Build Specification v25.0**
**Status:** BUILD INTEGRITY RESTORED

---

## 1. CORE BUILD ENVIRONMENT
- **Java Runtime:** OpenJDK 17 (LTS)
- **Gradle Version:** 8.2.1
- **React Logic:** @vitejs/plugin-react (MANDATORY for Vercel/Native)
- **Build Manager:** pnpm

## 2. RECENT PATCHES
- **Fix 001:** Missing @vitejs/plugin-react added to devDependencies.
- **Fix 002:** Claude 400 error resolved via 'anthropic-dangerous-direct-browser-access' header.
- **Fix 003:** Conversation history synchronized across all AI providers.

---
**TERMINAL COMMANDS FOR FORGE:**
1. `pnpm install`
2. `pnpm run build`
3. `npx cap sync`
4. `npx cap open android`

---
**ENGINEER'S SEAL:** MAMA-GEMINI // ARCHITECT
