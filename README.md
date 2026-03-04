# Codename (MVP)

Jeu web Next.js (TypeScript) inspiré de **Codenames**, avec un moteur pur séparé dans `src/engine/` (testable) et une UI dans `src/app/`.

- **Phase 1 (MVP)**: 1 seul PC, 2 vues dans 2 onglets (Public / Master) synchronisées via `localStorage`.
- **Phase 2 (option)**: WebSocket / Socket.io (non implémenté ici).

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvre `http://localhost:3000`.

## Jouer (MVP 2 onglets)

- Va sur l’accueil, clique **Créer (local)**.
- Ouvre **Public** dans un onglet.
- Ouvre **Master** dans un autre onglet (le PIN est dans l’URL `#pin=...`).

## Tests (engine)

```bash
npm test
```

## Structure

- `src/engine/`: moteur (types/config/setup/rules/reducer/selectors) + tests Vitest
- `src/app/`: UI Next.js (App Router)
- `src/components/`: composants UI (Board, Card, Panels)
