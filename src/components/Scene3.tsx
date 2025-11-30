import { configureMeshVisibility, SCENE_CONSTANTS, MODEL_PATH } from './Scene3D';
import { useFrame, useThree } from '@react-three/fiber';
import { JSX, useRef, useState, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { gsap } from 'gsap';
import {
    Object3D,
    AnimationAction,
    Vector3,
} from "three";

import { Scene } from './Scene';
import { TimelineDescription } from './TimelineDescription';

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

export class Scene3 implements Scene {

    readonly frameCount: number = 2;

    camera({ currentFrame }: { currentFrame: number }) {
        const { camera } = useThree();

        const cameraPositions = [
            {    
                position: [16.32, 4.13, 5.99] as [number, number, number],
                rotation: [-0.00, -0.57, -0.00] as [number, number, number],
            }
        ];

        useEffect(() => {
            camera.position.set(...cameraPositions[currentFrame % cameraPositions.length].position);
            camera.rotation.set(...cameraPositions[currentFrame % cameraPositions.length].rotation);   
        }, []);
        
        return null;
    }

    lighting({ currentFrame }: { currentFrame: number; }): JSX.Element {
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
            </>
        );
    }

    objects({ currentFrame }: { currentFrame: number }) {
    
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
    
            if (currentFrame === 0) {
                gsap.set(empty.position, { x: 3 });
            } else if (currentFrame === 1) {
                gsap.set(empty.position, { x: 3 });
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
        }, [currentFrame, empty]);
    
        // Update traffic light states based on train position
        useFrame(() => {
            if (!train) return;
    
            const worldPos = new Vector3();
            train.getWorldPosition(worldPos);
            const tx = worldPos.x;
    
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

    description({ currentFrame }: { currentFrame: number; }): JSX.Element {
    
        const timelineSteps = [
            {
                title: "鉄道の信号機",
                description: "次、この「閉塞区間」はどう並ぶか表示します。"
            },
            {
                title: "鉄道の信号機",
                description: "三つの色を持っている信号機は列車の進行方向に置いて、後続の列車の許容速度は、先行の列車との距離に決めています。こうやって、新幹線の開業からの従来に、鉄道車両が衝突を回避できました。でも、新幹線では地上である信号機は不十分。高速では、運転士が信号機を見落とす可能が上がりますので、「ＡＴＣ」は新しい技でヒューマンエラーによる事故を防ぎます。"
            },
        ];

        return (
            <TimelineDescription
                title={timelineSteps[currentFrame].title}
                description={timelineSteps[currentFrame].description}
                currentStep={currentFrame + 1}
                totalSteps={timelineSteps.length}
            />
        );
    }
}
