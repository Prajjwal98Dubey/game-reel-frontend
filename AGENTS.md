This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions

npm run mock-api            # build the games and serve the mock API + game bundles on :3000
npm run start:go            # run in Expo Go (storage falls back to expo-sqlite kv-store)
npm run web | android | ios # run in the browser or a development build (MMKV)
npm run lint                # ESLint (eslint.config.js)
npm run typecheck           # tsc --noEmit
npm test                    # Jest + React Native Testing Library
npm run games:test          # headless check of every game in games/
```

Run lint, typecheck and tests before declaring any task done.

## Design

- All UI follows the **Sticker Deck** design system in FRONTEND.md §17. Read it before building or changing any screen.
- The brand name is set only in `brand.json` (read via `src/config/brand.ts`); never hard-code it.
- Colours, fonts, outlines, radii, shadows and spacing come from `src/theme` only. Build screens from the components in `src/components` (`Sticker`, `StickerButton`, `IconButton`, `Chip`, `Tag`, `AppText`, …).

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in the root `app/` folder (FRONTEND.md §4): every file there is a screen, and `_layout.tsx` files define navigators. Route files stay thin and only compose screens from `src/features/*`.
- Do not create a `src/app/` folder. Expo Router prefers `src/app/` over `app/` when both exist, so adding one would silently replace every route.
- Non-route code lives in `src/` (features, components, services, stores, theme) and is imported with the `@/` alias (`@/` → `src/`).
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.config.ts` (this project has no `app.json`) and config plugins.
- Expo Go only includes its bundled native modules; the app must keep running in it. Storage picks MMKV or expo-sqlite's kv-store at runtime (`src/services/storage`). Before adding a native library, check it ships in Expo Go or give it a fallback. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
