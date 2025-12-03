import { SCENE_CONSTANTS, ANIMATION_CONSTANTS, MODEL_PATH } from './Scene3D';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect, JSX, use } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { gsap } from 'gsap';
import { Scene, AnimateVector } from './utils';
import {
    Object3D,
    Mesh,
    Quaternion,
    Vector3,
    AnimationAction,
} from "three";
import { TimelineDescription } from './TimelineDescription';
import MagneticFieldBands from './MagneticFieldBands';
import { useSceneSpeed } from './Scene3';
import { ATCSpeedDisplay } from './SpeedDisplay';
import { WaveformDisplay } from './WaveformDisplay';
import { PiecewisePlot } from './PiecewisePlot';

function CircuitWire({
    start,
    end,
    color = "rgba(255, 170, 0, 1)",
}: {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
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

    }, [start, end, direction]);

    return (
        <mesh ref={wireRef} position={midpoint}>
            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

export class Scene4 implements Scene {

    readonly frameCount = 6;

    camera({ currentFrame }: { currentFrame: number }) {

        const cameraPositions = [
            {
                // Staring at 受電器
                // Camera position: x=-11.42, y=0.61, z=3.67 | rotation (rad): x=0.17, y=-0.00, z=0.00
                position: { x: -11.42, y: 0.61, z: 3.67 },
                rotation: { x: 0.17, y: -0.00, z: 0.00 },

            },
            {
                // starting at the signal generator
                // Camera position: x=-3.46, y=2.90, z=3.45 | rotation (rad): x=-0.72, y=-0.59, z=-0.46
                position: { x: -3.46, y: 2.90, z: 3.45 },
                rotation: { x: -0.72, y: -0.59, z: -0.46 },
            },
            {
                // looking at the logic box
                // Camera position: x=-3.77, y=1.73, z=8.64 | rotation (rad): x=-0.69, y=-0.91, z=-0.58
                position: { x: -3.77, y: 1.73, z: 8.64 },
                rotation: { x: -0.69, y: -0.91, z: -0.58 },
            }
        ];

        const { camera } = useThree();
        const cameraSettingIndices = [0, 0, 0, 0, 1, 2];
        useEffect(() => {
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(camera.rotation);

            const targetIndex = cameraSettingIndices[currentFrame];
            const endPos = cameraPositions[targetIndex].position;
            const endRot = cameraPositions[targetIndex].rotation;

            AnimateVector(camera.position, endPos, 2, (x, y, z) => camera.position.set(x, y, z));
            AnimateVector(camera.rotation, endRot, 2, (x, y, z) => camera.rotation.set(x, y, z));

            return () => { gsap.killTweensOf(camera.position); gsap.killTweensOf(camera.rotation); }
        }, [currentFrame]);

        return null;
    }

    lighting({ currentFrame }: { currentFrame: number; }): JSX.Element {
        return (
            <>
                <ambientLight intensity={10} />
                {/* <directionalLight
                    position={[0, 10, 0]}
                    intensity={4.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                /> */}
                <directionalLight intensity={3} position={[-10, -10, 0]} />
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
        const { speed, setSpeed, speedLimit, setSpeedLimit } = useSceneSpeed();

        // empty object is parent to train and axles
        const empty = scene.getObjectByName("empty");
        const train = scene.getObjectByName("train");
        const rails = scene.getObjectByName("rails");

        const receiverRef = useRef<Object3D | null>(null);

        const INNER_WIDTH = 3.03;
        // Initialize scene: add rail copies and configure train visibility
        useEffect(() => {
            const addedObjects: Object3D[] = [];

            if (train) {
                train.position.set(0.8, 0.1, 0);
            }

            // Add rail copies on both sides
            if (rails) {
                const rails_copy1 = rails.clone();
                rails_copy1.position.x = 22.699;
                scene.add(rails_copy1);
                addedObjects.push(rails_copy1);
            }

            // Show only axles, hide train body
            if (empty) {
                // configureMeshVisibility(empty, true);
                empty.traverse((obj: Object3D) => {
                    if (obj.name.toLowerCase().includes("train")) {
                        obj.visible = true;
                    } else if (obj.name?.toLowerCase() === "axle") {
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


            // Play axle animations
            if (actions) {
                const played: AnimationAction[] = [];
                Object.entries(actions).forEach(([key, action]) => {
                    if (action && (key.startsWith("axleAction") || key === "sleepersAction")) {
                        action.reset();
                        action.play();
                        played.push(action);
                    }
                });

                return () => {
                    if (train) train.position.set(0, 0, 0);
                    played.forEach((a) => a.stop());
                    addedObjects.forEach((obj) => scene.remove(obj));
                    if (empty) empty.position.set(0, 0, 0);
                    if (empty) {
                        empty.position.set(0, 0, 0);
                        empty.traverse((obj: Object3D) => {
                            obj.visible = true;
                        });
                    }
                };
            }

            return () => {
                addedObjects.forEach((obj) => scene.remove(obj));
                if (train) train.position.set(0, 0, 0);
                if (empty) {
                    empty.position.set(0, 0, 0);
                    empty.traverse((obj: Object3D) => {
                        obj.visible = true;
                    });
                }
            };
        }, []);

        useEffect(() => {
            if (!actions) return;

            const speedScale = speed / ANIMATION_CONSTANTS.BASE_SPEED_DIVISOR;
            Object.entries(actions).forEach(([key, action]) => {
                if (action && (key.startsWith("axleAction") || key === "sleepersAction")) {
                    if (key.startsWith("axleAction")) {
                        action.timeScale = speedScale;
                    } else {
                        action.timeScale = speedScale * ANIMATION_CONSTANTS.SPEED_MULTIPLIER;
                    }
                }
            });
        }, [speed]);

        // GSAP animations based on stepNumber
        const [waveSpeed, setWaveSpeed] = useState(0);
        useEffect(() => {
            if (!empty) return;

            gsap.killTweensOf(empty.position);
            gsap.set(empty.position, { x: -10 });

            const animations = {
                0: () => {
                    setSpeed(160);
                    setSpeedLimit(160);
                },
                1: () => {
                    // setWaveSpeed(120);
                    setSpeedLimit(160);
                    const speedObj = { val: speed };
                    gsap.to(speedObj, {
                        val: 160,
                        duration: 1.5,
                        ease: "linear",
                        onUpdate: () => setSpeed(speedObj.val)
                    });
                },
                2: () => {
                    // setWaveSpeed(70);
                    setSpeedLimit(70);
                    const speedObj = { val: speed };
                    gsap.to(speedObj, {
                        val: 70,
                        duration: 1.5,
                        ease: "linear",
                        onUpdate: () => setSpeed(speedObj.val)
                    });
                },

                3: () => {
                    // setWaveSpeed(0);
                    setSpeedLimit(0);
                    const speedObj = { val: speed };
                    gsap.to(speedObj, {
                        val: 0,
                        duration: 2,
                        ease: "linear",
                        onUpdate: () => setSpeed(speedObj.val)
                    });
                },
                5: () => {
                    setSpeed(0);
                }
            };

            animations[currentFrame as keyof typeof animations]?.();

            return () => gsap.killTweensOf(empty.position);
        }, [currentFrame, empty]);

        useEffect(() => {
            setTimeout(() => setWaveSpeed(speedLimit), 500);
        }, [speedLimit]);

        const circuitHeight = 0.2;
        const frontAxlePosX = -12.16;
        const waveFrequencyRate = 0.03;

        return (
            <>
                <primitive ref={group} object={scene} />
                <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[70, 10]} />
                    <meshStandardMaterial color="grey" />
                </mesh>

                {/* 受電器 */}
                <mesh ref={receiverRef} position={[-11.2, 0.8, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 1, 8]} />
                    <meshStandardMaterial color="rgba(61, 61, 62, 1)" />
                    <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
                        <CircuitWire
                            start={[0, 0, INNER_WIDTH / 4]}
                            end={[0, 0, -INNER_WIDTH / 4]}
                            color="#ff6600"
                        />
                        <CircuitWire
                            start={[0, 0, -INNER_WIDTH / 4]}
                            end={[0, 1, -INNER_WIDTH / 4]}
                            color="#ff6600"
                        />
                        <CircuitWire
                            start={[0, 0, INNER_WIDTH / 4]}
                            end={[0, 1, INNER_WIDTH / 4]}
                            color="#ff6600"
                        />
                    </group>
                </mesh>

                {/* Circuit wires */}
                <mesh position={[0, circuitHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <boxGeometry args={[0.8, 1.2, 0.4]} />
                    <meshStandardMaterial color="#2a2a2a" />
                </mesh>
                <CircuitWire
                    start={[0, circuitHeight, INNER_WIDTH / 2]}
                    end={[0, circuitHeight, -INNER_WIDTH / 2]}
                    color="#ff6600"
                />
                <CircuitWire
                    start={[0, circuitHeight, -INNER_WIDTH / 2]}
                    end={[frontAxlePosX, circuitHeight, -INNER_WIDTH / 2]}
                    color="#ff6600"
                />
                <CircuitWire
                    start={[frontAxlePosX, circuitHeight, INNER_WIDTH / 2]}
                    end={[0, circuitHeight, INNER_WIDTH / 2]}
                    color="#ff6600"
                />

                {/* Magnetic Field Bands */}
                {currentFrame > 0 && <MagneticFieldBands
                    position={[frontAxlePosX + 2, circuitHeight, INNER_WIDTH / 2]}
                    wireDirection={[-1, 0, 0]}
                    bandCount={5}
                    bandSpacing={0.5}
                    baseRadius={0.3}
                    radiusAmplitude={0.7}
                    animationSpeed={waveSpeed * waveFrequencyRate}
                    opacity={0.6}
                    bandThickness={0.05}
                    showArrows={true}
                    arrowColor="rgba(240, 236, 170, 1)"
                />}

                {/* Data In */}
                <CircuitWire
                    start={[0.2, circuitHeight, 0]}
                    end={[0.2, circuitHeight, 8]}
                    color="rgba(57, 93, 165, 1)"
                />
                <CircuitWire
                    start={[0.2, circuitHeight, 8]}
                    end={[0.2, circuitHeight, 10]}
                    color="rgba(177, 72, 40, 1)"
                />
                <CircuitWire
                    end={[0.2, circuitHeight + 0.05, 10]}
                    start={[0.2, -0.8, 10]}
                    color="rgba(177, 72, 40, 1)"
                />
                {/* Transmission Box */}
                <group position={[0, -0.8, 8]}>
                    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[6, 10]} />
                        <meshStandardMaterial color="grey" />
                    </mesh>
                    <mesh position={[0, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <boxGeometry args={[1, 3, 2]} />
                        <meshStandardMaterial color="rgba(61, 61, 62, 1)" />
                    </mesh>
                    <mesh position={[-0.5, 1, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>
                        <boxGeometry args={[0.25, 1.25, 1.5]} />
                        <meshStandardMaterial color="rgba(19, 19, 22, 1)" />
                    </mesh>
                    <mesh position={[-0.5, 1, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
                        <boxGeometry args={[0.25, 1.25, 1.5]} />
                        <meshStandardMaterial color="rgba(19, 19, 22, 1)" />
                    </mesh>
                </group>
            </>
        );
    }

    description({ currentFrame }: { currentFrame: number; }): JSX.Element {

        const timelineSteps = [
            {
                title: "軌道回路と電流信号",
                description: ``
            },
            {
                title: "軌道回路と電流信号",
                description: ``
            },
            {
                title: "軌道回路と電流信号",
                description: ``
            },
            {
                title: "軌道回路と電流信号",
                description: ``
            },
            {
                title: "軌道回路と電流信号",
                description: ``
            },
            {
                title: "軌道回路と電流信号",
                description: ``
            },
        ];

        const { speed, setSpeed, speedLimit, setSpeedLimit } = useSceneSpeed();
        return (
            <div className="flex flex-row gap-4">
                <div className="flex-1">
                    <TimelineDescription
                        title={timelineSteps[currentFrame].title}
                        description={timelineSteps[currentFrame].description}
                        currentStep={currentFrame + 1}
                        totalSteps={timelineSteps.length}
                    />
                </div>
                <div className="flex-1">
                    <ATCSpeedDisplay
                        currentSpeed={speed}
                        speedLimit={speedLimit}
                        onSpeedChange={(s) => setSpeed(s)}
                        onLimitChange={(l) => setSpeedLimit(l)}
                    />
                </div>
                <div className="flex-1">
                    <WaveformDisplay fn={(elapsedTime) => Math.sin(elapsedTime * 2 * Math.PI * (speedLimit / 260))} />
                </div>
            </div>
        );
    }
}
