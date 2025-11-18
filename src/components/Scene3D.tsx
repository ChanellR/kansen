import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations, OrbitControls } from "@react-three/drei";
import { 
    Object3D, 
    AnimationAction, 
    Mesh, 
    DoubleSide, 
    Box3, 
    Vector3, 
    PointLight, 
    Quaternion 
} from "three";
import gsap from 'gsap';

// Reference links for ATC system design:
// https://ja.wikipedia.org/wiki/%E8%87%AA%E5%8B%95%E5%88%97%E8%BB%8A%E5%88%B6%E5%BE%A1%E8%A3%85%E7%BD%AE#cite_ref-5
// https://ja.wikipedia.org/wiki/%E8%BB%8C%E9%81%93%E5%9B%9E%E8%B7%AF
// https://ja.wikipedia.org/wiki/%E6%8C%AF%E5%B9%85%E5%A4%89%E8%AA%BF

// Preload 3D models
useGLTF.preload("models/shinkansen_with_track.glb");
useGLTF.preload("models/shinkansen_separated.glb");

// ============================================================================
// CONSTANTS
// ============================================================================

const SCENE_CONSTANTS = {
    RAIL_SEGMENT_LENGTH: 23.7,
    RAIL_WIDTH: 3.646,
    INNER_RAIL_WIDTH: 3.03,
    RAIL_LENGTH: 23.6993,
    INTRA_WIDTH: 3.507,
    INTER_WIDTH: 10.309,
} as const;

const ANIMATION_CONSTANTS = {
    FLOAT_SPEED: 2.3,
    FLOAT_AMPLITUDE_XZ: 0.2,
    FLOAT_AMPLITUDE_Y: 0.2,
    SPEED_MULTIPLIER: 4.67,
    BASE_SPEED_DIVISOR: 210 / 5,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface SceneProps1 {
    maxSpeed: number;
}

interface SceneProps2 {
    stepNumber: number;
}

interface SceneProps3 {
    stepNumber: number;
}

interface ATCProps {
    maxSpeed: number;
    sceneNumber: number;
}

type TrafficLightState = 'red' | 'orange' | 'green';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enables shadows and double-sided rendering for all meshes in an object
 */
function configureMeshVisibility(obj: Object3D, visible = true) {
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

export function Scene1({ maxSpeed }: SceneProps1) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF("models/shinkansen_separated_3.glb");
    const { actions } = useAnimations(animations, scene);

    const sleepersActionRef = useRef<AnimationAction | null>(null);
    const axleActionsRef = useRef<AnimationAction[]>([]);

    const BASE_POSITION = { x: 15, y: 0, z: 0 };
    const empty = scene.getObjectByName("empty");

    // Floating animation
    useFrame(({ clock }) => {
        if (!group.current) return;
        
        const time = clock.getElapsedTime();
        const floatX = Math.sin(time * ANIMATION_CONSTANTS.FLOAT_SPEED) * ANIMATION_CONSTANTS.FLOAT_AMPLITUDE_XZ;
        const floatY = Math.sin(time * 2) * ANIMATION_CONSTANTS.FLOAT_AMPLITUDE_Y;
        const floatZ = Math.sin(time * ANIMATION_CONSTANTS.FLOAT_SPEED) * 0.1;
        
        group.current.position.set(
            BASE_POSITION.x + floatX,
            BASE_POSITION.y + floatY,
            BASE_POSITION.z + floatZ
        );
    });

    // Initialize scene objects and animations
    useEffect(() => {
        const addedObjects: Object3D[] = [];

        if (empty) {
            configureMeshVisibility(empty, true);
            const light = addCenterLight(empty);
            addedObjects.push(light);
        }

        if (group.current) {
            group.current.scale.z = -1;
        }

        if (!actions) return;
        
        const played: AnimationAction[] = [];
        Object.entries(actions).forEach(([key, action]) => {
            if (action) {
                action.reset();
                action.play();
                
                if (key === "sleepersAction") {
                    sleepersActionRef.current = action;
                } else if (key.startsWith("axleAction")) {
                    axleActionsRef.current.push(action);
                }
                played.push(action);
            }
        });
        
        return () => {
            played.forEach((a) => a.stop());
            addedObjects.forEach((obj) => scene.remove(obj));
            if (group.current) group.current.position.set(0, 0, 0);
        };
    }, [actions, empty, scene]);

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

    return <primitive ref={group} object={scene} />;
}

// ============================================================================
// CIRCUIT VISUALIZATION COMPONENTS
// ============================================================================

function Battery({ position }: { position: [number, number, number] }) {
    return (
        <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
            {/* Battery body */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.8, 1.2, 0.4]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>
            {/* Positive terminal */}
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[0.3, 0.2, 0.15]} />
                <meshStandardMaterial color="#cc3333" />
            </mesh>
            {/* Negative terminal */}
            <mesh position={[0, -0.7, 0]}>
                <boxGeometry args={[0.3, 0.1, 0.15]} />
                <meshStandardMaterial color="#333333" />
            </mesh>
            {/* + symbol */}
            <mesh position={[0.05, 0.85, 0.21]}>
                <boxGeometry args={[0.15, 0.03, 0.02]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.05, 0.85, 0.21]}>
                <boxGeometry args={[0.03, 0.15, 0.02]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* - symbol */}
            <mesh position={[0.05, -0.85, 0.21]}>
                <boxGeometry args={[0.15, 0.03, 0.02]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

function TrafficLight({ position, isGreen }: { position: [number, number, number]; isGreen: boolean }) {
    const redColor = isGreen ? "#330000" : "#ff0000";
    const greenColor = isGreen ? "#00ff00" : "#003300";
    const redIntensity = isGreen ? 0 : 0.5;
    const greenIntensity = isGreen ? 0.5 : 0;

    return (
        <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.5, 1.5, 0.4]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0, 0.4, 0.21]}>
                <circleGeometry args={[0.18, 16]} />
                <meshStandardMaterial
                    color={redColor}
                    emissive={isGreen ? "#000000" : "#ff0000"}
                    emissiveIntensity={redIntensity}
                />
            </mesh>
            <mesh position={[0, -0.4, 0.21]}>
                <circleGeometry args={[0.18, 16]} />
                <meshStandardMaterial
                    color={greenColor}
                    emissive={isGreen ? "#00ff00" : "#000000"}
                    emissiveIntensity={greenIntensity}
                />
            </mesh>
        </group>
    );
}

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

/**
 * Computes split point along a wire at a given X coordinate
 */
function computeWireSplitPoint(
    start: [number, number, number],
    end: [number, number, number],
    splitX: number
): [number, number, number] | null {
    const sx = start[0];
    const ex = end[0];
    
    if (Math.abs(ex - sx) < 1e-6) return null;
    
    const t = (splitX - sx) / (ex - sx);
    if (t <= 0 || t >= 1) return null;
    
    return [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
        start[2] + (end[2] - start[2]) * t
    ];
}

function CircuitWire({ 
    start, 
    end, 
    color = "#ffaa00", 
    splitAtX, 
    batteryX, 
    onColor = "#ff6600", 
    offColor = "#333333", 
    active = true 
}: { 
    start: [number, number, number]; 
    end: [number, number, number]; 
    color?: string; 
    splitAtX?: number | null; 
    batteryX?: number; 
    onColor?: string; 
    offColor?: string; 
    active?: boolean;
}) {
    const direction = new Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
    const length = direction.length();
    const midpoint: [number, number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2
    ];

    const wireRef = useRef<Mesh | null>(null);
    const wireRef2 = useRef<Mesh | null>(null);

    // Apply rotation to align cylinder with wire direction
    useEffect(() => {
        if (!wireRef.current) return;
        
        const yAxis = new Vector3(0, 1, 0);
        const quaternion = new Quaternion().setFromUnitVectors(yAxis, direction.clone().normalize());
        wireRef.current.setRotationFromQuaternion(quaternion);

        if (wireRef2.current && typeof splitAtX === 'number') {
            const splitPoint = computeWireSplitPoint(start, end, splitAtX);
            if (splitPoint) {
                const dir2 = new Vector3(
                    end[0] - splitPoint[0],
                    end[1] - splitPoint[1],
                    end[2] - splitPoint[2]
                );
                const quaternion2 = new Quaternion().setFromUnitVectors(yAxis, dir2.normalize());
                wireRef2.current.setRotationFromQuaternion(quaternion2);
            }
        }
    }, [start, end, splitAtX, direction]);

    // Render split wire if splitAtX is provided
    if (typeof splitAtX === 'number') {
        const splitPoint = computeWireSplitPoint(start, end, splitAtX);
        
        if (splitPoint) {
            const mid1: [number, number, number] = [
                (start[0] + splitPoint[0]) / 2,
                (start[1] + splitPoint[1]) / 2,
                (start[2] + splitPoint[2]) / 2,
            ];
            const mid2: [number, number, number] = [
                (end[0] + splitPoint[0]) / 2,
                (end[1] + splitPoint[1]) / 2,
                (end[2] + splitPoint[2]) / 2,
            ];

            const len1 = new Vector3(
                splitPoint[0] - start[0],
                splitPoint[1] - start[1],
                splitPoint[2] - start[2]
            ).length();
            const len2 = new Vector3(
                end[0] - splitPoint[0],
                end[1] - splitPoint[1],
                end[2] - splitPoint[2]
            ).length();

            const batterySideStart = typeof batteryX === 'number'
                ? Math.abs(start[0] - batteryX) < Math.abs(end[0] - batteryX)
                : true;

            const color1 = active ? (batterySideStart ? onColor : offColor) : onColor;
            const color2 = active ? (batterySideStart ? offColor : onColor) : onColor;

            return (
                <>
                    <mesh ref={wireRef} position={mid1}>
                        <cylinderGeometry args={[0.05, 0.05, len1, 8]} />
                        <meshStandardMaterial color={color1} />
                    </mesh>
                    <mesh ref={wireRef2} position={mid2}>
                        <cylinderGeometry args={[0.05, 0.05, len2, 8]} />
                        <meshStandardMaterial color={color2} />
                    </mesh>
                </>
            );
        }
    }

    const finalColor = active ? color : offColor;
    return (
        <mesh ref={wireRef} position={midpoint}>
            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
            <meshStandardMaterial color={finalColor} />
        </mesh>
    );
}

// ============================================================================
// SCENE 2: TRACK CIRCUIT DEMONSTRATION
// ============================================================================

export function Scene2({ stepNumber }: SceneProps2) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF("models/shinkansen_separated_3.glb");
    const { actions } = useAnimations(animations, scene);
    
    const empty = scene.getObjectByName("empty");
    const rails = scene.getObjectByName("rails");
    const axleObjectRef = useRef<Object3D | null>(null);
    
    const [trainCenterX, setTrainCenterX] = useState<number | null>(null);
    const [isTrafficOccupied, setIsTrafficOccupied] = useState(false);

    const TRAFFIC_LIGHT_POS_X = -21;
    const INNER_WIDTH = 3.03;

    // Initialize scene: add rail copies and configure train visibility
    useEffect(() => {
        const addedObjects: Object3D[] = [];

        // Add rail copies on both sides
        if (rails) {
            const [rails_copy1, rails_copy2] = [rails.clone(), rails.clone()];
            rails_copy1.position.x = 23.699;
            rails_copy2.position.x = -23.699;
            scene.add(rails_copy1, rails_copy2);
            addedObjects.push(rails_copy1, rails_copy2);
        }

        // Show only axles, hide train body
        if (empty) {
            empty.traverse((obj: Object3D) => {
                // obj.visible = true;
                // Make axles visible but train body invisible
                if (obj.name.toLowerCase().includes("train")) {
                    obj.visible = false;
                } else {
                    obj.visible = true;
                    obj.castShadow = true;
                }

            });
        }

        if (group.current) {
            group.current.position.set(0, 0, 0);
            group.current.scale.z = -1;
        }

        return () => {
            addedObjects.forEach((obj) => scene.remove(obj));
            if (empty) {
                empty.position.set(0, 0, 0);
                empty.traverse((obj : Object3D) => {
                    obj.visible = true;
                });
            }
        };
    }, [empty, rails, scene]);

    // Find axle object for tracking
    useEffect(() => {
        axleObjectRef.current = null;
        if (!empty) return;
        
        empty.traverse((obj: Object3D) => {
            if (obj.name?.toLowerCase() === "axle") {
                axleObjectRef.current = obj;
            }
        });
    }, [empty]);

    // Track train position and update circuit state
    useFrame(() => {
        if (!axleObjectRef.current) {
            setTrainCenterX(null);
            setIsTrafficOccupied(false);
            return;
        }
        
        const worldPos = new Vector3();
        axleObjectRef.current.getWorldPosition(worldPos);
        const x = worldPos.x;
        
        let xPos = null;
        if (x >= TRAFFIC_LIGHT_POS_X && x <= SCENE_CONSTANTS.INTRA_WIDTH * 2 + SCENE_CONSTANTS.INTER_WIDTH) {
            if (x <= 0) {
                xPos = x;
            } else if (x <= SCENE_CONSTANTS.INTRA_WIDTH) {
                xPos = x - SCENE_CONSTANTS.INTRA_WIDTH;
            } else if (x <= SCENE_CONSTANTS.INTRA_WIDTH + SCENE_CONSTANTS.INTER_WIDTH) {
                xPos = x - (SCENE_CONSTANTS.INTRA_WIDTH + SCENE_CONSTANTS.INTER_WIDTH);
            } else {
                xPos = x - (SCENE_CONSTANTS.INTRA_WIDTH * 2 + SCENE_CONSTANTS.INTER_WIDTH);
            }
        }
        
        setTrainCenterX(xPos);
        setIsTrafficOccupied(xPos !== null);
    });

    // GSAP animations based on stepNumber
    useEffect(() => {
        if (!empty) return;

        gsap.killTweensOf(empty.position);

        const animations = {
            1: () => gsap.set(empty.position, { x: -25 }),
            2: () => {
                gsap.set(empty.position, { x: -25 });
                gsap.to(empty.position, {
                    x: -0.1,
                    duration: 4,
                    ease: "power1.inOut",
                    repeat: -1,
                    repeatDelay: 1,
                    onRepeat: () => { gsap.set(empty.position, { x: -30 }); }
                });
            },
            3: () => {
                gsap.set(empty.position, { x: -0.1 });
                gsap.to(empty.position, {
                    x: 35,
                    duration: 4,
                    ease: "power1.inOut",
                    repeat: -1,
                    repeatDelay: 1,
                    onRepeat: () => { gsap.set(empty.position, { x: 0 }); }
                });
            },
        };

        animations[stepNumber as keyof typeof animations]?.();

        return () => gsap.killTweensOf(empty.position);
    }, [stepNumber, empty]);

    return (
        <>
            <primitive ref={group} object={scene} />
            <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[90, 10]} />
                <meshStandardMaterial color="grey" />
            </mesh>

            <Battery position={[0, 1, 0]} />
            <TrafficLight position={[TRAFFIC_LIGHT_POS_X, 1, 3]} isGreen={!isTrafficOccupied} />

            {/* Circuit wires */}
            <CircuitWire 
                start={[0, 1, INNER_WIDTH / 2]} 
                end={[0, 1, -INNER_WIDTH / 2]} 
                color="#ff6600" 
            />
            <CircuitWire 
                start={[0, 1, -INNER_WIDTH / 2]} 
                end={[TRAFFIC_LIGHT_POS_X, 1, -INNER_WIDTH / 2]} 
                splitAtX={trainCenterX ?? undefined} 
                batteryX={0} 
                onColor="#ff6600" 
                offColor="#333333" 
                active={!trainCenterX || isTrafficOccupied} 
            />
            <CircuitWire 
                start={[TRAFFIC_LIGHT_POS_X, 1, -INNER_WIDTH / 2]} 
                end={[TRAFFIC_LIGHT_POS_X, 1, 3]} 
                color="#ff6600" 
                active={!isTrafficOccupied} 
            />
            <CircuitWire 
                start={[TRAFFIC_LIGHT_POS_X, 1, 3]} 
                end={[TRAFFIC_LIGHT_POS_X + 0.5, 1, 3]} 
                color="#ff6600" 
                active={!isTrafficOccupied} 
            />
            <CircuitWire 
                start={[TRAFFIC_LIGHT_POS_X + 0.5, 1, 3]} 
                end={[TRAFFIC_LIGHT_POS_X + 0.5, 1, INNER_WIDTH / 2]} 
                color="#ff6600" 
                active={!isTrafficOccupied} 
            />
            <CircuitWire 
                start={[TRAFFIC_LIGHT_POS_X + 0.5, 1, INNER_WIDTH / 2]} 
                end={[0, 1, INNER_WIDTH / 2]} 
                splitAtX={trainCenterX ?? undefined} 
                batteryX={0} 
                onColor="#ff6600" 
                offColor="#333333" 
                active={!trainCenterX || isTrafficOccupied} 
            />
        </>
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

export function Scene3({ stepNumber }: SceneProps3) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF("models/shinkansen_separated_3.glb");
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

        if (train) {
            configureMeshVisibility(train, true);
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

        if (group.current) {
            group.current.scale.z = -1;
            group.current.position.y = 0;
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
    }, [actions, train, rails, scene]);

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
    }, [sceneNumber, camera]);

    return null;
}

// ============================================================================
// MAIN SCENE CONTAINER
// ============================================================================

// ============================================================================
// MAIN SCENE CONTAINER
// ============================================================================

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
