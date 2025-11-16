# Copilot / AI Assistant Instructions for 3D Model Timeline Website

A short, focused guide for AI assistants to be productive in this repository.

## Big-picture architecture (what to know first)
- This is a React + Vite single-page app. Entry point: `src/main.tsx` -> `src/App.tsx`.
- The app mixes standard UI and a small 3D visualization stack:
  - UI layer: `src/components/ui/*` (Radix + Tailwind patterns, `cn` helper for class names).
  - 3D layer: `@react-three/fiber`, `@react-three/drei` and Three.js inside `src/components/*` (Scene3D, InteractiveScene, MovingObject, Model3D).
  - Data flow: `MovingObject` raises `onSpeedChange` to `App` which stores `speedHistory` & updates `SpeedControls`/`SpeedGraph`.
- Static models are in the `models/` directory (e.g., `models/shinkansen_with_track.glb`).

## Developer workflows & commands
- Install deps: `npm i` (project uses Vite & package aliases -> see `vite.config.ts`).
- Local dev: `npm run dev` (server configured to open at port 3000 in `vite.config.ts`).
- Build: `npm run build` (creates `build/` folder per `vite.config.ts`).
- No test runner is configured — keep changes small and verify visually in the dev server.

## Conventions and patterns specific to this repo
- UI: `src/components/ui/*` follow the ShadCN/Radix pattern: small, generic primitives (e.g., `Slider`, `Accordion`) with the `cn` importer.
  - Use `cn()` to merge Tailwind classes (`src/components/ui/utils.ts`).
  - Export components as named exports (e.g., `export { Slider }`).
- Three.js / react-three:
  - Use `useGLTF.preload("models/xxx.glb")` + `useGLTF("models/xxx.glb")` to load models.
  - Prefer `useFrame` for per-frame animations; use `useEffect` for setup/teardown of animations.
  - Animations created in GLTF are accessed with `useAnimations` and set via `action.setEffectiveTimeScale()` for runtime speed control (see `Scene3D.tsx`).
- Speed mapping:
  - `MovingObject` computes `velocity` from drag events and reports speed with `onSpeedChange`. This feeds `App.tsx`'s `speedHistory` (updated every 100ms).
- Vite aliases: `vite.config.ts` pins specific versions for many dependencies (Radix, lucide, recharts). When adding dependencies, update `alias` to ensure consistency.

## Integration points & external dependencies
- Major 3rd-party SDKs: `@react-three/fiber`, `@react-three/drei`, `three`, `@react-spring/three`, `recharts`, `radix-ui` packages.
- UI icons: `lucide-react` (used in `App.tsx`).
- Styling: Tailwind (global variables in `src/index.css`). Use `className` and `cn()`.

## Common tasks & examples
- Add a new scene with a glTF:
  1. Put `.glb` in `models/`.
  2. Call `useGLTF.preload('models/your_model.glb')` at top-level and `useGLTF('models/your_model.glb')` in the new scene component.
  3. Add scene component to `src/components/Scene3D.tsx` and toggle from `App.tsx`.
- Add a UI control (Slider/Button):
  1. Implement in `src/components/ui/*` following existing patterns (Radix primitives + `cn()` + `data-slot` attributes).
  2. Export the component and import into pages.
- Debugging 3D issues:
  - Use `console.log` in `useFrame` or the `CameraLogger` sample in `Scene3D.tsx` to inspect camera and object transforms.
  - Use model `traverse` to enable `castShadow`/`receiveShadow` and inspect materials.

## Project-specific caveats (what to watch out for)
- GLTFs can be heavy. Keep models optimized (decimate/polyreduce) to avoid freezes in the dev server.
- The app currently uses large `ambientLight` and multiple lights; when adjusting lighting, also check shadow map sizes in `Canvas` and light props (`shadow-mapSize-width`, `shadow-mapSize-height`) to avoid memory spikes.
- `vite.config.ts` contains aliases for specific package versions — if you bump a dependency, update the alias to match.
- The `src/components/ui` library follows accessibility patterns but we recommend verifying a11y after changes.

## If you change global layout or tokens
- Check `src/index.css` and `src/components/guidelines/Guidelines.md` (guidance template) for theme variables.
- Keep design tokens and spacing consistent with Tailwind variables in `index.css`.

## Where to look for examples
- Animation speed mapping & GLTF use: `src/components/Scene3D.tsx` (see `sleepersActionRef`, `axleActionsRef` usage)
- Drag + physics example: `src/components/MovingObject.tsx` (pointer interactions + velocity)
- Live graph of speed: `src/components/SpeedGraph.tsx` + `src/components/SpeedControls.tsx`

---
If anything is missing or you'd like things written differently (more examples, specific debugging recipes, or new conventions), tell me which sections to expand. I can also add code snippets to `Guidelines.md` for faster onboarding. 
