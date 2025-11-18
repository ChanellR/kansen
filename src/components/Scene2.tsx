import { SCENE_CONSTANTS } from './Scene3D';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { gsap } from 'gsap';
import {
    Object3D,
    Mesh,
    Quaternion,
    Vector3,
} from "three";

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

// ============================================================================
// SCENE 2: TRACK CIRCUIT DEMONSTRATION
// ============================================================================

interface SceneProps2 {
    stepNumber: number;
}

export function Scene2({ stepNumber }: SceneProps2) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF("models/shinkansen_separated_3.glb");

    const empty = scene.getObjectByName("empty");
    const rails = scene.getObjectByName("rails");
    const axleObjectRef = useRef<Object3D | null>(null);

    const [frontAxlePosX, setfrontAxlePosX] = useState<number | null>(null);
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
                if (obj.name.toLowerCase().includes("train")) {
                    obj.visible = false;
                } else if (obj.name?.toLowerCase() === "axle") {
                    axleObjectRef.current = obj;
                    obj.visible = true;
                    obj.castShadow = true;
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
                empty.traverse((obj: Object3D) => {
                    obj.visible = true;
                });
            }
        };
    }, []);

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

    // Track front axle position and update circuit state
    useFrame(() => {
        if (!axleObjectRef.current) {
            setfrontAxlePosX(null);
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

        setfrontAxlePosX(xPos);
        setIsTrafficOccupied(xPos !== null);
    });

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
                splitAtX={frontAxlePosX ?? undefined}
                batteryX={0}
                onColor="#ff6600"
                offColor="#333333"
                active={!frontAxlePosX || isTrafficOccupied}
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
                splitAtX={frontAxlePosX ?? undefined}
                batteryX={0}
                onColor="#ff6600"
                offColor="#333333"
                active={!frontAxlePosX || isTrafficOccupied}
            />
        </>
    );
}
