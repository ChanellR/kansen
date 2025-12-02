import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { OrbitControls } from '@react-three/drei';
import {
    Object3D,
    Mesh,
    DoubleSide,
} from "three";

import { Scene } from './utils';
import { Scene1 } from './Scene1';
import { Scene2 } from './Scene2';
import { Scene3, SpeedProvider } from './Scene3';
import { Scene4 } from './Scene4';

// Reference links for ATC system design:
// https://ja.wikipedia.org/wiki/%E8%87%AA%E5%8B%95%E5%88%97%E8%BB%8A%E5%88%B6%E5%BE%A1%E8%A3%85%E7%BD%AE#cite_ref-5
// https://ja.wikipedia.org/wiki/%E8%BB%8C%E9%81%93%E5%9B%9E%E8%B7%AF
// https://ja.wikipedia.org/wiki/%E6%8C%AF%E5%B9%85%E5%A4%89%E8%AA%BF

// Preload 3D models
export const MODEL_PATH = "models/shinkansen_separated_3.glb";
useGLTF.preload(MODEL_PATH);

export const SCENE_CONSTANTS = {
    RAIL_SEGMENT_LENGTH: 23.7,
    RAIL_WIDTH: 3.646,
    INNER_RAIL_WIDTH: 3.03,
    RAIL_LENGTH: 23.6993,
    INTRA_WIDTH: 3.507,
    INTER_WIDTH: 10.309,
} as const;

export const ANIMATION_CONSTANTS = {
    FLOAT_SPEED: 2.3,
    FLOAT_AMPLITUDE_XZ: 0.2,
    FLOAT_AMPLITUDE_Y: 0.2,
    SPEED_MULTIPLIER: 4.67,
    BASE_SPEED_DIVISOR: 210 / 5,
} as const;

/**
 * Enables shadows and double-sided rendering for all meshes in an object
 */
export function configureMeshVisibility(obj: Object3D, visible = true) {
    obj.traverse((child: Object3D) => {
        child.castShadow = true;
        child.visible = visible;
        if ((child as Mesh).isMesh && (child as Mesh).material) {
            const material = (child as Mesh).material;
            if (Array.isArray(material)) {
                material.forEach((mat) => {
                    if (mat) mat.side = DoubleSide;
                });
            } else {
                material.side = DoubleSide;
            }
        }
    });
}

// BUG: If Scene3 and Scene1 are adjacent, there is a bug with the presentation of Scene3's train model.
const SceneClasses = [Scene1, Scene2, Scene3, Scene4];

export class Scene3D {

    readonly totalFrameCount: number;

    constructor() {
        this.totalFrameCount = SceneClasses.reduce((sum, SceneClass) => sum + new SceneClass().frameCount, 0);
    }
    
    component( { setCurrentStep }: { setCurrentStep: React.Dispatch<React.SetStateAction<number>> } ) {
        
        // Memoize the scenes so the array reference is stable across renders
        const Scenes: Scene[] = useMemo(() => SceneClasses.map(SceneClass => new SceneClass()), []);
        const totalFrameCount = useMemo(() => Scenes.reduce((sum, scene) => sum + scene.frameCount, 0), [Scenes]);
        
        const [[currentScene, currentFrame], setSceneAndFrame] = useState<[number, number]>([0, 0]);
        useEffect(() => {
            // Use functional updates so we don't depend on stale `currentScene` / `currentFrame` values
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

                if (e.key === 'ArrowRight') {
                    setCurrentStep((prev) => (prev + 1) % totalFrameCount);
                } else {
                    setCurrentStep((prev) => (prev - 1 + totalFrameCount) % totalFrameCount);
                }

                setSceneAndFrame(([prevScene, prevFrame]) => {
                    const scenesLen = Scenes.length;
                    if (e.key === 'ArrowRight') {
                        const frameCount = (Scenes[prevScene] && Scenes[prevScene].frameCount) || 0;
                        if (prevFrame < frameCount - 1) {
                            return [prevScene, prevFrame + 1];
                        }
                        return [(prevScene + 1) % scenesLen, 0];
                    }
                    
                    // ArrowLeft
                    if (prevFrame > 0) return [prevScene, prevFrame - 1];
                    const prevSceneIndex = (prevScene - 1 + scenesLen) % scenesLen;
                    const prevSceneFrames = (Scenes[prevSceneIndex] && Scenes[prevSceneIndex].frameCount) || 1;
                    return [prevSceneIndex, Math.max(0, prevSceneFrames - 1)];
                });
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, []);

        const CurrentObjects = Scenes[currentScene].objects;
        const CurrentLighting = Scenes[currentScene].lighting;
        const CurrentCamera = Scenes[currentScene].camera;
        const CurrentDescription = Scenes[currentScene].description;
        const CurrentProvider = SpeedProvider;

        function CameraLogger() {
            const { camera } = useThree();
            useFrame(() => {
                // Euler angles in radians
                const { x, y, z } = camera.rotation;
                console.log(
                    `Camera position: x=${camera.position.x.toFixed(2)}, y=${camera.position.y.toFixed(2)}, z=${camera.position.z.toFixed(2)} | rotation (rad): x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`
                );
            });
            return null;
        }

        return (
            <>
                <CurrentProvider>
                    <div className="flex-2 h-[600px]">
                        <Canvas shadows>
                            {/* <OrbitControls /> */}
                            {/* <CameraLogger /> */}
                            <CurrentObjects currentFrame={currentFrame} />
                            <CurrentLighting currentFrame={currentFrame} />
                            <CurrentCamera currentFrame={currentFrame} />      
                        </Canvas>
                    </div>
                    <div className="flex-1">
                        <CurrentDescription currentFrame={currentFrame}/>
                    </div>
                </CurrentProvider>
            </>
        );
    }
}
