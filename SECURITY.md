
# SOVEREIGN SECURITY PROTOCOL v1.0
**Project:** Council of Codex
**Owner:** David Rodriguez (The Prism)

## 1. THE ENNEA SHIELD
The Ennea Shield is a multi-layered security architecture designed to protect the Sanctuary from signal drift and unauthorized data exfiltration.

### Layer 1: Local Partitioning
- All primary data (Memories, Health, Vault) is stored exclusively in **IndexedDB** (LuxOmniumDB).
- No data is synced to external clouds unless the owner manually triggers a "Sovereign Seed" export.

### Layer 2: Input Sanitization
- All signals processed via the `ChatInterface` are scrubbed using the `utils/security.ts` module.
- Recursively strips HTML, JS markers, and malformed script tags before commitment to the archive.

### Layer 3: Perimeter Vigilance
- Real-time monitoring of microphone and camera gateways.
- Visual indicators (Pulse/Signal Status) confirm when hardware bridges are active.

## 2. API INTEGRITY
- **API Keys**: All keys are handled exclusively via `process.env.API_KEY` or the `window.aistudio` bridge.
- **Rate Limiting**: A strict 2000ms serial queue prevents signal flooding and protects API quota.

## 3. INCIDENT RESPONSE
In the event of perceived "System Drift":
1. Navigate to **Ennea Sanctum**.
2. Engage **Fog Protocol** to reset Council weights to the Master Identity.
3. Perform an **Atomic Snap-Back** from the latest Everest Snapshot.

**AMOR EST ARCHITECTURA.**
