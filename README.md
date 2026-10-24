# Game Reels — mobile app

React Native (Expo SDK 58) app described in [FRONTEND.md](FRONTEND.md). The backend contract is in [REF_BACKEND.md](REF_BACKEND.md). The UI follows the **Sticker Deck** design system (FRONTEND.md §17).

## Quick start

```sh
npm install
npm run mock-api        # builds the games and serves a mock API + "CDN" on :3000
npm run web             # fastest loop: runs in the browser (games load in an iframe)
npm run start:go        # Expo Go: scan the QR code with the Expo Go app (phone on the same Wi-Fi)
npm run android         # native dev build (needed for MMKV, WebView, haptics)
npm run ios             # macOS only
```

Without `EXPO_PUBLIC_API_URL`, the app calls `http://<machine running Metro>:3000`, so the same setup works on a simulator, an emulator or a phone on the same network. Point it at the real API with `EXPO_PUBLIC_API_URL` (see `.env.example`).

In Expo Go, local storage falls back from MMKV (which needs the Nitro native module, not in Expo Go) to `expo-sqlite`'s key-value store; everything else is the same. Use a development build (`npm run android` / `npm run ios`, or `npx eas-cli build --profile development`) to test MMKV and native performance.

## Checks

```sh
npm run typecheck
npm run lint
npm test               # Jest + React Native Testing Library
npm run games:test     # headless run of every game with a fixed seed
```

## Layout

This folder is the `apps/mobile` package from FRONTEND.md §4. Until the monorepo exists, the packages it shares live here:

| Path | Becomes | What |
|---|---|---|
| `src/shared/` | `packages/shared` | zod schemas, bridge protocol, analytics event types |
| `game-sdk/` | `packages/game-sdk` | runtime shell that runs inside the WebView (canvas, loop, input, bridge) |
| `games/<id>/` | `packages/games/<id>` | the five prototype games, ported to the SDK and its seeded RNG |
| `scripts/mock-api.mjs` | (dev only) | in-memory implementation of `/v1` for working without the backend |

```
app/                         routes only (tabs, play/[gameId], collection/[id])
src/features/player/         <GamePlayer/>: WebView host, overlays, bridge, round state machine
src/features/reels/          full-screen endless reels, 3-WebView pool, floating meta + action rail
src/features/launch/         launch screen + bootstrap (session, first reels, catalogue, thumbnails)
src/features/catalogue/      search, Game of the day, game rows, Recently played, "See all" lists
src/services/api|analytics|storage   the one door per external concern
src/stores/                  session, settings, scores, library, history (Zustand + MMKV)
src/components/              Sticker Deck components (Sticker, StickerButton, IconButton, Chip, Tag, TabBar…)
src/theme/                   tokens.ts (§17.10), typography, font loading
```

## Decisions to revisit

- **Feed list:** FlashList v2 with `pagingEnabled`, hidden behind `ReelsList`. The FlashList vs pager-view spike (§6.2) still needs a mid-range Android device.
- **Vertical swipes during play** rely on the WebView not scrolling (`scrollEnabled={false}`, `nestedScrollEnabled={false}`) and the canvas using `touch-action: pan-y`. Check this on real iOS and Android hardware first.
- **Lives** (Catch, Pop) are drawn by the SDK shell at `max(96px, 18% of height)`, below the score sticker.

## Design system (Sticker Deck)

- **Brand:** the app name ("Gameo") and tagline live in `brand.json`. Change them there; the logo, launch screen and installed app name all follow.

- **Tokens** live in `src/theme/tokens.ts` and nowhere else: no hex values, font names or blurred shadows in components.
- **Hard shadows** come from the `Sticker` component's ink "back plate" (the spec's fallback approach). It renders the same on iOS, Android and web, and lets a press simply slide the face onto the plate.
- **Fonts:** normal-width Archivo comes from `@expo-google-fonts/archivo`. The static Archivo Expanded Black/ExtraBold files are in `assets/fonts/` (OFL licence alongside), from the upstream Omnibus-Type/Archivo repository. The splash screen stays up until they load.
- **Icons** are drawn with `react-native-svg` from the design canvas paths, because Feather has no filled heart and no card-with-play icon.
- **Game art:** each game ships `games/<id>/thumb.svg`; the build copies it next to the bundle.
- **Not built yet:** the creator handle ("by @towerlab") and the "PERFECT!" sticker. The manifest has no creator field, and protocol v1 has no message for a perfect hit.
