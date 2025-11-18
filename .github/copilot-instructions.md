(# Copilot instructions for kansen)

This project is a small Vite + React + Three.js interactive site with UI components in `src/components` and 3D models in `public/models`.

## Quick start (dev & build)
- Install deps: `npm i`
- Start dev server: `npm run dev` (Vite)
- Build production bundle: `npm run build`

## Architecture & how to be productive
- App root: `src/App.tsx` — orchestrates layout, keyboard controls, timeline steps and passes `maxSpeed` + `sceneNumber` to `Scene3D`.
- Three scenes: `src/components/Scene1.tsx`, `Scene2.tsx`, `Scene3.tsx` and `Scene3D.tsx` are the 3D components; they load `public/models/shinkansen_separated_3.glb` through `useGLTF`.
- Camera + lighting: `Scene3D.CameraUpdater` sets camera positions based on the timeline step.
- Animations: Scenes use `gsap` for movement and `useAnimations` from `@react-three/drei` for GLTF animation clips. `AXLE`/`sleepersAction` naming is meaningful — keep names in the GLTF when changing model.

## Key patterns & conventions
- GLTF nodes: Scenes access named nodes like `train`, `empty`, `rails`, `axle` via `scene.getObjectByName("...")`. Preserve names in the GLTF file to avoid runtime breakage.
- Visibility & shading: Use `configureMeshVisibility` (exported from `Scene3D.tsx`) when changing object visibility; it also sets `DoubleSide` material and `castShadow` to keep consistent rendering.
- Constants: `SCENE_CONSTANTS` and `ANIMATION_CONSTANTS` are central. Avoid magic numbers; update these constants when adding new rails/segments.
- 3D coordinates: coordinate math is used heavily (e.g., `computeWireSplitPoint`, `calculateTrafficLightState`).
- UI: `src/components/ui` contains design-system primitives (Radix, Tailwind) used throughout. Prefer reusing these for new buttons, sliders, and to maintain consistent look.

## Debugging & troubleshooting tips
- If 3D model doesn’t appear: confirm `public/models/shinkansen_separated_3.glb` exists and `useGLTF.preload(MODEL_PATH)` is called. VK
- For animation issues: check `useAnimations` action names (look in the GLTF file with a GLTF viewer), and that `actions` exist before calling `.play()`.
- For camera/lighting issues: check `CameraUpdater` mapping in `Scene3D.tsx` and `Canvas` props in `Scene3D`.
- If Vite dev server fails: run with `npm run dev` and inspect terminal logs; missing deps will show here.

## Suggested edits workflow for new scenes
1. Add new scene file in `src/components` (copy pattern from `Scene2.tsx`).
2. Load model (if needed) with `useGLTF` and set named nodes.
3. Use `configureMeshVisibility` if toggling visibility or applying double-sided materials.
4. Add camera presets in `Scene3D.tsx` and update `renderScene` to include your new scene.

## Focus for Copilot PRs & code suggestions
- Keep modifications minimal and local: prefer adding a new component rather than refactoring many files.
- When changing playback/animation, do not assume other scenes’ node names changed; update both code and `.glb` nodes together.
- For UI: match `tailwind` + design tokens (see `src/components/ui/*`) and reuse small building blocks (e.g., `Slider`, `SpeedGraph`).

## Agentic Interactions
- Be brief in summarizing the results of a chat interaction, do not instruct the user on how to run the application, or give them unnecessary tips. 

If anything is unclear or you want me to expand specific sections (e.g., testing, run scripts, or model editing workflow), tell me what you'd like clarified.
