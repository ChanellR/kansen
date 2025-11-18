import { configureMeshVisibility, SCENE_CONSTANTS, MODEL_PATH } from './Scene3D';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { gsap } from 'gsap';
import {
    Object3D,
    AnimationAction,
    Vector3,
} from "three";

type TrafficLightState = 'red' | 'orange' | 'green';

function TrafficLightThreeColor({
    position,
    state = 'green'
}: {
    position: [number, number, number];
    state?: TrafficLightState;
}) {
    const getLightConfig = (lightColor: TrafficLightState) => {
        const isActive = state === lightColor;
        const colors = {
            red: { on: "#ff0000", off: "#330000" },
            orange: { on: "#ff9900", off: "#331a00" },
            green: { on: "#00ff00", off: "#003300" },
        };

        return {
            color: isActive ? colors[lightColor].on : colors[lightColor].off,
            emissive: isActive ? colors[lightColor].on : "#000000",
            intensity: isActive ? 0.5 : 0,
        };
    };

    return (
        <group position={position} rotation={[0, -Math.PI / 2, Math.PI]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.5, 2.0, 0.4]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {(['red', 'orange', 'green'] as TrafficLightState[]).map((color, idx) => {
                const yPos = 0.6 - idx * 0.6;
                const config = getLightConfig(color);
                return (
                    <mesh key={color} position={[0, yPos, 0.21]}>
                        <circleGeometry args={[0.18, 16]} />
                        <meshStandardMaterial
                            color={config.color}
                            emissive={config.emissive}
                            emissiveIntensity={config.intensity}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

// ============================================================================
// SCENE 3: MULTIPLE TRACK CIRCUITS
// ============================================================================

interface SceneProps3 {
    stepNumber: number;
}

/**
 * Calculates traffic light state based on train position
 */
function calculateTrafficLightState(
    trainX: number,
    lightIndex: number,
    railSegmentLength: number
): TrafficLightState {
    const startX = lightIndex * railSegmentLength;
    const endX = startX + railSegmentLength;

    if (trainX >= startX && trainX < endX) {
        return 'red';
    } else if (trainX >= endX && trainX < endX + railSegmentLength) {
        return 'orange';
    }
    return 'green';
}

export function Scene3({ stepNumber }: SceneProps3) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF(MODEL_PATH);
    const { actions } = useAnimations(animations, scene);

    const train = scene.getObjectByName("train");
    const rails = scene.getObjectByName("rails");
    const empty = scene.getObjectByName("empty");
    
    const NUM_LIGHTS = 4;
    const [trafficLightStates, setTrafficLightStates] = useState<TrafficLightState[]>(
        Array(NUM_LIGHTS).fill('green')
    );

    // Initialize scene: create rail segments and configure train
    useEffect(() => {
        const addedObjects: Object3D[] = [];

        if (group.current) {
            group.current.scale.z = -1;
            group.current.position.y = 0;
        }

        // Create additional rail segments (4 total)
        if (rails) {
            for (let i = 1; i < 5; i++) {
                const railsCopy = rails.clone();
                railsCopy.position.x = i * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH;
                scene.add(railsCopy);
                addedObjects.push(railsCopy);
            }
        }

        if (empty) {
            configureMeshVisibility(empty, true);
        }

        // Play axle animations
        if (actions) {
            const played: AnimationAction[] = [];
            Object.entries(actions).forEach(([key, action]) => {
                if (action && key.startsWith("axleAction")) {
                    action.reset();
                    action.play();
                    played.push(action);
                }
            });

            return () => {
                played.forEach((a) => a.stop());
                addedObjects.forEach((obj) => scene.remove(obj));
                if (empty) empty.position.set(0, 0, 0);
            };
        }

        return () => {
            addedObjects.forEach((obj) => scene.remove(obj));
        };
    }, []);

    // Animate train position
    useEffect(() => {
        if (!empty) return;

        gsap.killTweensOf(empty.position);

        if (stepNumber === 1) {
            gsap.set(empty.position, { x: -2 });
        } else if (stepNumber === 2) {
            gsap.set(empty.position, { x: -2 });
            gsap.to(empty.position, {
                x: 90,
                duration: 6,
                ease: "linear",
                repeat: -1,
                repeatDelay: 1,
                onRepeat: () => { gsap.set(empty.position, { x: 0 }); }
            });
        }

        return () => gsap.killTweensOf(empty.position);
    }, [stepNumber, empty]);

    // Update traffic light states based on train position
    useFrame(() => {
        if (!train) return;

        const worldPos = new Vector3();
        train.getWorldPosition(worldPos);
        const tx = worldPos.x + SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH * 0.4;

        const nextStates = Array.from({ length: NUM_LIGHTS }, (_, idx) =>
            calculateTrafficLightState(tx, idx + 1, SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH)
        );

        // Only update state if changed
        const hasChanged = nextStates.some((state, i) => state !== trafficLightStates[i]);
        if (hasChanged) {
            setTrafficLightStates(nextStates);
        }
    });

    return (
        <>
            <primitive ref={group} object={scene} />
            <mesh position={[45, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[140, 10]} />
                <meshStandardMaterial color="grey" />
            </mesh>

            {/* Traffic lights at the beginning of each rail segment */}
            {Array.from({ length: NUM_LIGHTS }, (_, i) => {
                const lightIndex = i + 1;
                return (
                    <group key={lightIndex}>
                        <TrafficLightThreeColor
                            position={[
                                lightIndex * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH,
                                3,
                                3
                            ]}
                            state={trafficLightStates[i]}
                        />
                        <mesh
                            position={[
                                lightIndex * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH,
                                1.5,
                                3
                            ]}
                            rotation={[0, 0, 0]}
                        >
                            <cylinderGeometry args={[0.1, 0.1, 3, 16]} />
                            <meshStandardMaterial color="#333333" />
                        </mesh>
                    </group>
                );
            })}
        </>
    );
}