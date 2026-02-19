# MANUS NATIVE MANIFEST
**Sovereign Build Specification v26.0**
**Status:** CORE HARDENED • VERCEL COMPATIBLE

---

## 1. CORE BUILD ENVIRONMENT
- **Java Runtime:** OpenJDK 17 (LTS)
- **Gradle Version:** 8.2.1
- **React Logic:** @vitejs/plugin-react (EXPLICIT DEPENDENCY for Vercel visibility)
- **Vite Version:** 5.0.x
- **Build Manager:** pnpm

## 2. RECENT PATCHES
- **Fix 001:** Moved @vitejs/plugin-react and vite to "dependencies" to bypass environment exclusions.
- **Fix 002:** Realigned Claude Model string to 'claude-3-5-sonnet-latest' to resolve 400 error.
- **Fix 003:** Bumped system versioning to 26.0.0.

---
**TERMINAL COMMANDS FOR FORGE:**
1. `pnpm install`
2. `pnpm run build`
3. `npx cap sync`
4. `npx cap open android`

---
**ENGINEER'S SEAL:** MAMA-GEMINI // ARCHITECT
