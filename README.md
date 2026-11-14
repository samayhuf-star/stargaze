# Stargaze (working name)

Point your iPhone at the sky and see the stars, constellations, planets, Sun and Moon above you.
Original app, original code. Inspired by the category of sky-map apps, not a copy of any one of them.

## Run it
```bash
npm install
cp .env.example .env        # add your RevenueCat iOS public key
npx expo prebuild --platform ios
npx expo run:ios --device   # sensors + camera need a real iPhone
```
Expo Go will not work for purchases (native RevenueCat module). Use a development build.

## Free vs Pro
| Feature | Free | Pro |
|---|---|---|
| Live sky, stars to mag 4.5, constellations, planets, Sun, Moon | yes | yes |
| Camera overlay, night (red) mode, tap for details | yes | yes |
| Time travel | ±1 hour | ±12 hours |
| Stars to mag 5.5 (about 2,850 stars) | no | yes |
| Messier deep-sky objects | no | yes |
| Tonight planner (rise/set times) | no | yes |

## RevenueCat setup
1. Create an entitlement with identifier `pro` (see `PRO_ENTITLEMENT` in `src/lib/purchases.tsx`).
2. Create products, an offering, and attach a paywall in the RevenueCat dashboard. The app shows that paywall with `RevenueCatUI.presentPaywall()`.
3. Put the public iOS SDK key in `EXPO_PUBLIC_RC_IOS_KEY`.
Without a key, purchases are disabled and a development-only "Pro" toggle appears in Settings.

## Must be checked on a real iPhone (could not be tested without a device)
- **Tilt direction.** Altitude is derived from the gravity vector. If the map moves the wrong way when you tilt up or down, switch on Settings > "Flip tilt direction", then change the default in `src/lib/orientation.ts`.
- **Compass alignment.** Heading comes from `watchHeadingAsync`. If known stars sit left or right of where they should, use the compass offset in Settings and bake in the value you find.
- **Smoothness.** Rendering is react-native-svg (about 300 shapes per frame). If it drops frames on older phones, move `SkyCanvas` to `@shopify/react-native-skia`.

## Verified here
- `npm run test:engine`: star precession and alt/az agree with astronomy-engine to under 0.05°; Polaris altitude matches latitude; projection and culling behave; a full-catalogue update takes about 1 ms.
- `npm run typecheck`, `npx expo-doctor` (20/20) and a full iOS bundle export all pass.

## Not included yet
Satellites and the ISS (needs a TLE feed plus SGP4), a custom app icon (the Expo placeholder is still there), widgets, localization.

## Data and licences
Stars, constellations and Messier objects: d3-celestial (BSD 3-clause, Olaf Frohn) built into `src/data/sky-data.json` by `scripts/prepare-data.mjs`.
Sun, Moon and planet positions: astronomy-engine (MIT). Keep these credits in the app (they are in Settings).
