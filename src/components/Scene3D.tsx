import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import {
    Object3D,
    Mesh,
    DoubleSide,
} from "three";

import { Scene1 } from './Scene1';
import { Scene2 } from './Scene2';
import { Scene3 } from './Scene3';

// Reference links for ATC system design:
// https://ja.wikipedia.org/wiki/%E8%87%AA%E5%8B%95%E5%88%97%E8%BB%8A%E5%88%B6%E5%BE%A1%E8%A3%85%E7%BD%AE#cite_ref-5
// https://ja.wikipedia.org/wiki/%E8%BB%8C%E9%81%93%E5%9B%9E%E8%B7%AF
// https://ja.wikipedia.org/wiki/%E6%8C%AF%E5%B9%85%E5%A4%89%E8%AA%BF

// Preload 3D models
useGLTF.preload("models/shinkansen_separated_3.glb");

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

interface ATCProps {
    maxSpeed: number;
    sceneNumber: number;
}

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


// ============================================================================
// CAMERA CONTROL COMPONENTS
// ============================================================================

/**
 * Camera position configurations for each scene
 */
const CAMERA_POSITIONS = {
    scene1: {
        position: [13.9, 4.82, 7.01] as [number, number, number],
        rotation: [-0.47, 0.44, 0.21] as [number, number, number],
    },
    scene2and3: {
        position: [-12, 11, 0] as [number, number, number],
        rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    },
    scene4plus: {
        position: [16.32, 4.13, 5.99] as [number, number, number],
        rotation: [-0.00, -0.57, -0.00] as [number, number, number],
    },
} as const;

function CameraUpdater({ sceneNumber }: { sceneNumber: number }) {
    const { camera } = useThree();

    useEffect(() => {
        let config;
        if (sceneNumber > 3) {
            config = CAMERA_POSITIONS.scene4plus;
        } else if (sceneNumber > 0) {
            config = CAMERA_POSITIONS.scene2and3;
        } else {
            config = CAMERA_POSITIONS.scene1;
        }

        camera.position.set(...config.position);
        camera.rotation.set(...config.rotation);
        camera.updateProjectionMatrix();
    }, [sceneNumber]);

    return null;
}

export function Scene3D({ maxSpeed, sceneNumber }: ATCProps) {
    const renderScene = () => {
        if (sceneNumber > 3) {
            return (
                <>
                    <ambientLight intensity={10} />
                    <directionalLight
                        position={[10, 8, 8]}
                        intensity={4.5}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                    <Scene3 stepNumber={sceneNumber - 3} />
                </>
            );
        }

        if (sceneNumber > 0) {
            return (
                <>
                    <ambientLight intensity={10} />
                    <directionalLight
                        position={[0, 10, 0]}
                        intensity={4.5}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                    <Scene2 stepNumber={sceneNumber} />
                </>
            );
        }

        return (
            <>
                <ambientLight intensity={10} />
                <directionalLight
                    position={[10, 8, 8]}
                    intensity={4.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <Scene1 maxSpeed={maxSpeed} />
            </>
        );
    };

    return (
        <div className="w-full h-[600px]">
            <Canvas shadows>
                <CameraUpdater sceneNumber={sceneNumber} />
                {/* <OrbitControls /> */}
                {renderScene()}
            </Canvas>
        </div>
    );
}
