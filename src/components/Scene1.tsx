import { ANIMATION_CONSTANTS, configureMeshVisibility } from './Scene3D';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import {
    Object3D,
    AnimationAction,
    PointLight,
    Vector3,
    Box3,
} from "three";

/**
 * Adds a point light at the center of a 3D object
 */
function addCenterLight(obj: Object3D, intensity = 2, distance = 10, decay = 2): PointLight {
    const boundingBox = new Box3().setFromObject(obj);
    const center = new Vector3();
    boundingBox.getCenter(center);

    const light = new PointLight(0xffffff, intensity, distance, decay);
    light.position.copy(center);
    obj.add(light);
    return light;
}

// ============================================================================
// SCENE 1: FLOATING TRAIN WITH SPEED CONTROL
// ============================================================================

interface SceneProps1 {
    maxSpeed: number;
}

export function Scene1({ maxSpeed }: SceneProps1) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF("models/shinkansen_separated_3.glb");
    const { actions } = useAnimations(animations, scene);

    const sleepersActionRef = useRef<AnimationAction | null>(null);
    const axleActionsRef = useRef<AnimationAction[]>([]);

    const empty = scene.getObjectByName("empty");

    // Initialize scene objects and animations
    useEffect(() => {
        
        if (group.current) {
            group.current.position.set(0, 0, 0);
            group.current.scale.z = -1;
        }

        const addedObjects: Object3D[] = [];
        if (empty) {
            configureMeshVisibility(empty, true);
            const light = addCenterLight(empty);
            addedObjects.push(light);
        }

        if (!actions) return;
        const played: AnimationAction[] = [];
        Object.entries(actions).forEach(([key, action]) => {
            if (action) {
                action.reset();
                action.play();
                played.push(action);

                if (key === "sleepersAction") {
                    sleepersActionRef.current = action;
                } else if (key.startsWith("axleAction")) {
                    axleActionsRef.current.push(action);
                }
            }
        });

        return () => {
            played.forEach((a) => a.stop());
            addedObjects.forEach((obj) => scene.remove(obj));
            if (group.current) group.current.position.set(0, 0, 0);
        };
    }, []);

    // Update animation speeds based on maxSpeed
    useEffect(() => {
        const speedScale = maxSpeed / ANIMATION_CONSTANTS.BASE_SPEED_DIVISOR;
        if (sleepersActionRef.current) {
            sleepersActionRef.current.setEffectiveTimeScale(speedScale * ANIMATION_CONSTANTS.SPEED_MULTIPLIER);
        }

        axleActionsRef.current.forEach((action) => {
            action.setEffectiveTimeScale(speedScale);
        });
    }, [maxSpeed]);

    // Floating animation
    useFrame(({ clock }) => {
        if (!group.current) return;

        const time = clock.getElapsedTime();
        const floatX = Math.sin(time * ANIMATION_CONSTANTS.FLOAT_SPEED) * ANIMATION_CONSTANTS.FLOAT_AMPLITUDE_XZ;
        const floatY = Math.sin(time * 2) * ANIMATION_CONSTANTS.FLOAT_AMPLITUDE_Y;
        const floatZ = Math.sin(time * ANIMATION_CONSTANTS.FLOAT_SPEED) * 0.1;
        
        const BASE_POSITION = { x: 15, y: 0, z: 0 };
        group.current.position.set(
            BASE_POSITION.x + floatX,
            BASE_POSITION.y + floatY,
            BASE_POSITION.z + floatZ
        );
    });

    return <primitive ref={group} object={scene} />;
}
