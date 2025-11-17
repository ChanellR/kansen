import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { createContext, useContext, useRef, PropsWithChildren, useEffect, useState } from "react";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import { Object3D, AnimationAction, AnimationMixer, Mesh, AxesHelper, DoubleSide, Box3, Vector3, PointLight, MeshStandardMaterial, Quaternion } from "three";
import gsap from 'gsap';
import { fromHalfFloat } from 'three/src/extras/DataUtils.js';

// https://ja.wikipedia.org/wiki/%E8%87%AA%E5%8B%95%E5%88%97%E8%BB%8A%E5%88%B6%E5%BE%A1%E8%A3%85%E7%BD%AE#cite_ref-5
// https://ja.wikipedia.org/wiki/%E8%BB%8C%E9%81%93%E5%9B%9E%E8%B7%AF
// https://ja.wikipedia.org/wiki/%E6%8C%AF%E5%B9%85%E5%A4%89%E8%AA%BF

useGLTF.preload("models/shinkansen_with_track.glb");

interface SceneProps1 {
    maxSpeed: number
};

export function Scene1({ maxSpeed }: SceneProps1) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF("models/shinkansen_with_track.glb");
    const { actions } = useAnimations(animations, scene);

    const sleepersActionRef = useRef<AnimationAction | null>(null);
    const axleActionsRef = useRef<Array<AnimationAction> | null>(new Array<AnimationAction>());

    const baseX = 15;
    const baseY = 0;
    const baseZ = 0;
    const train = scene.getObjectByName("train");

    // Add floating animation
    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();
        const floatX = Math.sin(time * 2.3) * 0.2; // Adjust speed and amplitude here
        const floatY = Math.sin(time * 2) * 0.2; // Adjust speed and amplitude here
        const floatZ = Math.sin(time * 2.3) * 0.1; // Adjust speed and amplitude here
        if (group.current) {
            group.current.position.x = baseX + floatX;
            group.current.position.y = baseY + floatY;
            group.current.position.z = baseZ + floatZ;
        }
    });

    useEffect(() => {
        if (train) {
            train.traverse((obj: Object3D) => {
                obj.castShadow = true;
                // Make train render double-sided
                if ((obj as Mesh).isMesh && (obj as Mesh).material) {
                    const material = (obj as Mesh).material;
                    if (Array.isArray(material)) {
                        material.forEach((mat) => {
                            if (mat) mat.side = DoubleSide;
                        });
                    } else {
                        material.side = DoubleSide;
                    }
                }
            });

            // Calculate the bounding box of the train
            const boundingBox = new Box3().setFromObject(train);
            const center = new Vector3();
            boundingBox.getCenter(center);

            // Add a point light at the center of the train
            const light = new PointLight(0xffffff, 2, 10, 2);
            light.position.copy(center);
            train.add(light);
        }

        if (group.current) {
            // group.current.position.x = 15; // Move group forward by x
            group.current.scale.z = -1; // Flip the group across the z-axis
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
                    axleActionsRef.current?.push(action);
                }
                played.push(action);
            }
        });
        return () => {
            played.forEach((a) => a.stop());
        };
    }, [actions]);

    useEffect(() => {
        if (sleepersActionRef.current) {
            sleepersActionRef.current.setEffectiveTimeScale((maxSpeed / (210 / 5)) * 4.67);
        }
        if (axleActionsRef.current) {
            axleActionsRef.current.forEach((action) => action.setEffectiveTimeScale((maxSpeed / (210 / 5))));
        }
    }, [maxSpeed]);

    return (
        <>
            {/* Render the train and add a point light inside it */}
            <primitive ref={group} object={scene} />
            {/* <mesh position={[3, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[30, 10]} />
                <meshStandardMaterial color="grey" />
            </mesh> */}
            {/* Global axes at world origin */}
            {/* <primitive object={new AxesHelper(5)} position={[0, 0, 0]} /> */}
        </>
    );
}

interface SceneProps2 {
    stepNumber: number
};

// Circuit visualization components
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

function TrafficLight({ position, isGreen }: { position: [number, number, number], isGreen: boolean }) {
    return (
        <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
            {/* Traffic light housing */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.5, 1.5, 0.4]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Red light */}
            <mesh position={[0, 0.4, 0.21]}>
                <circleGeometry args={[0.18, 16]} />
                <meshStandardMaterial
                    color={isGreen ? "#330000" : "#ff0000"}
                    emissive={isGreen ? "#000000" : "#ff0000"}
                    emissiveIntensity={isGreen ? 0 : 0.5}
                />
            </mesh>
            {/* Green light */}
            <mesh position={[0, -0.4, 0.21]}>
                <circleGeometry args={[0.18, 16]} />
                <meshStandardMaterial
                    color={isGreen ? "#00ff00" : "#003300"}
                    emissive={isGreen ? "#00ff00" : "#000000"}
                    emissiveIntensity={isGreen ? 0.5 : 0}
                />
            </mesh>
        </group>
    );
}

function CircuitWire({ start, end, color = "#ffaa00", splitAtX, batteryX, onColor = "#ff6600", offColor = "#333333", active = true }: { start: [number, number, number], end: [number, number, number], color?: string, splitAtX?: number | null, batteryX?: number, onColor?: string, offColor?: string, active?: boolean }) {
    const direction = new Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
    const length = direction.length();
    const midpoint: [number, number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2
    ];

    // splitAtX = Math.max(splitAtX ?? -Infinity, batteryX ?? -Infinity, -24);
    // splitAtX = 10;
    // if (splitAtX && batteryX) {
    //     if (splitAtX < batteryX) {
    //         splitAtX = 10;
    //     }
    // }

    const wireRef = useRef<Mesh | null>(null);
    const wireRef2 = useRef<Mesh | null>(null);

    useEffect(() => {
        if (!wireRef.current) return;
        // Cylinder is aligned on Y by default. Compute a quaternion which rotates Y to the direction.
        const yAxis = new Vector3(0, 1, 0);
        const quaternion = new Quaternion().setFromUnitVectors(yAxis, direction.clone().normalize());
        wireRef.current.setRotationFromQuaternion(quaternion);

        // If we have a second segment (split), compute and apply its rotation too.
        if (wireRef2.current && typeof (splitAtX) === 'number') {
            const computeSplitPoint = (splitX: number) => {
                const sx = start[0];
                const ex = end[0];
                if (Math.abs(ex - sx) < 1e-6) return null;
                const t = (splitX - sx) / (ex - sx);
                if (t <= 0 || t >= 1) return null;
                return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, start[2] + (end[2] - start[2]) * t];
            };
            const splitPoint = computeSplitPoint(splitAtX);
            if (splitPoint) {
                const dir2 = new Vector3(end[0] - splitPoint[0], end[1] - splitPoint[1], end[2] - splitPoint[2]);
                const quaternion2 = new Quaternion().setFromUnitVectors(yAxis, dir2.normalize());
                wireRef2.current.setRotationFromQuaternion(quaternion2);
            }
        }
    }, [start, end, splitAtX]);

    // Helper to compute an intersection along X-axis - returns world coords for t
    const computeSplitPoint = (splitX: number) => {
        const sx = start[0];
        const ex = end[0];
        if (Math.abs(ex - sx) < 1e-6) return null; // not an X-aligned segment
        const t = (splitX - sx) / (ex - sx);
        if (t <= 0 || t >= 1) return null; // not in range
        return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, start[2] + (end[2] - start[2]) * t];
    };

    // If a split is requested and this segment is aligned on X, render two segments
    if (typeof splitAtX === 'number') {
        const splitPoint = computeSplitPoint(splitAtX);
        if (splitPoint) {
            // Compute first segment (start -> splitPoint)
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

            const len1 = new Vector3(splitPoint[0] - start[0], splitPoint[1] - start[1], splitPoint[2] - start[2]).length();
            const len2 = new Vector3(end[0] - splitPoint[0], end[1] - splitPoint[1], end[2] - splitPoint[2]).length();

            // Determine which side is closer to the battery (if provided) and assign colors
            const batterySideStart = typeof batteryX === 'number'
                ? Math.abs(start[0] - batteryX) < Math.abs(end[0] - batteryX)
                : true;

            // If the axle short is on this segment, the battery side should be 'on'
            // For generality, we'll color the battery side with onColor and the other with offColor
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

export function Scene2({ stepNumber }: SceneProps2) {
    const group = useRef<any>(null);
    const { animations, scene } = useGLTF("models/shinkansen_separated.glb");
    const { actions } = useAnimations(animations, scene);
    
    const empty = scene.getObjectByName("TrainHullHome");
    const rails = scene.getObjectByName("rails");

    useEffect(() => {

        if (rails) {
            const [rails_copy1, rails_copy2] = [rails.clone(), rails.clone()];
            rails_copy1.position.x = 23.699;
            scene.add(rails_copy1);
            rails_copy2.position.x = -23.699;
            scene.add(rails_copy2);
        }

        if (empty) {
            empty.traverse((obj: Object3D) => {
                // Make axles visible but train body invisible
                if (obj.name.toLowerCase().includes("axle")) {
                    obj.castShadow = true;
                } else if ((obj as Mesh).isMesh) {
                    // Hide the train body meshes
                    obj.visible = false;
                }
            });
        }

        if (group.current) {
            group.current.position.x = 0;
            group.current.position.y = 0;
            group.current.position.z = 0;
            group.current.scale.z = -1; // Flip across z-axis
        }

    }, [stepNumber]);

    // Track axle objects and their world X positions so we can short circuit the rails
    const axleObjectRef = useRef<Object3D | null>(null);
    const [trainCenterX, setTrainCenterX] = useState<number | null>(null);

    useEffect(() => {
        axleObjectRef.current = null;
        if (!empty) return;
        empty.traverse((obj: Object3D) => {
            if (obj.name && obj.name.toLowerCase().includes("axle")) {
                axleObjectRef.current = obj;
                return;
            }
        });
    }, [empty]);

    const [isTrafficOccupied, setIsTrafficOccupied] = useState(false);

    useFrame(() => {
        if (!axleObjectRef.current) {
            setTrainCenterX(null);
            setIsTrafficOccupied(false);
            return;
        }
        
        const intraWidth = 3.507;
        const interWidth = 10.309;
        
        const worldPos = new Vector3();
        axleObjectRef.current.getWorldPosition(worldPos);
        const x = worldPos.x;
        let xPos = null;
        if (x < trafficLightPosX ) {
            xPos = (null);
        } else if (x <= 0) {
            xPos = (x);
        } else if (x <= intraWidth) {
            xPos = (x - intraWidth);
        } else if (x <= intraWidth + interWidth) {
            xPos = (x - (intraWidth + interWidth));
        } else if (x <= intraWidth * 2 + interWidth) {
            xPos = (x - (intraWidth * 2 + interWidth));
        } else {
            xPos = (null);
        }
        setTrainCenterX(xPos ? xPos - 2 : null);
        setIsTrafficOccupied(trainCenterX !== null);
    });

    // GSAP animations based on stepNumber
    useEffect(() => {
        if (!empty) return;

        // Kill any existing animations on the empty object
        gsap.killTweensOf(empty.position);

        if (stepNumber === 1) {
            // Step 1: Position at -30
            gsap.set(empty.position, { x: -30 });
        } else if (stepNumber === 2) {
            // Step 2: Loop from -30 to 0
            gsap.set(empty.position, { x: -30 });
            gsap.to(empty.position, {
                x: -0.1,
                duration: 4,
                ease: "power1.inOut",
                repeat: -1,
                repeatDelay: 1,
                yoyo: false,
                onRepeat: () => {
                    gsap.set(empty.position, { x: -30 });
                }
            });
        } else if (stepNumber === 3) {
            // Step 3: Translate from 0 to 30
            gsap.set(empty.position, { x: -0.1 });
            gsap.to(empty.position, {
                x: 35,
                duration: 4,
                ease: "power1.inOut",
                repeat: -1,
                repeatDelay: 1,
                yoyo: false,
                onRepeat: () => {
                    gsap.set(empty.position, { x: 0 });
                }
            });
        }

        // Cleanup function to kill animations when component unmounts or stepNumber changes
        return () => {
            gsap.killTweensOf(empty.position);
        };
    }, [stepNumber, empty]);

    const railWidth = 3.646;
    const innerWidth = 3.03;
    const railLength = 23.6993;
    const trafficLightPosX = -21;

    return (
        <>
            <primitive ref={group} object={scene} />
            <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[90, 10]} />
                <meshStandardMaterial color="grey" />
            </mesh>

            {/* Circuit visualization */}
            {/* Battery on the right */}
            <Battery position={[0, 1, 0]} />

            {/* Traffic light on the left: green if an axle is in the segment between traffic light and battery */}
            <TrafficLight position={[trafficLightPosX, 1, 3]} isGreen={isTrafficOccupied} />

            {/* Circuit wires - creating a loop */}
            {/* From battery positive to right rail */}
            <CircuitWire start={[0, 1, innerWidth / 2]} end={[0, 1, -innerWidth / 2]} color="#ff6600" />

            {/* Right rail segment (represented as wire) - split where the train is (short circuit) */}
            {/* Check if any axle sits on the right rail segment to decide whether it's shorted */}
            {
                <CircuitWire start={[0, 1, -innerWidth / 2]} end={[trafficLightPosX, 1, -innerWidth / 2]} splitAtX={trainCenterX ?? undefined} batteryX={0} onColor="#ff6600" offColor="#333333" active={trainCenterX == undefined|| isTrafficOccupied} />
            }

            {/* From left rail to traffic light */}
            <CircuitWire start={[trafficLightPosX, 1, -innerWidth / 2]} end={[trafficLightPosX, 1, 3]} color="#ff6600" active={!isTrafficOccupied} />
            {/* Outside of the traffic light */}
            <CircuitWire start={[trafficLightPosX, 1, 3]} end={[trafficLightPosX + 0.5, 1, 3]} color="#ff6600" active={!isTrafficOccupied} />
            {/* From traffic light to rail  */}
            <CircuitWire start={[trafficLightPosX + 0.5, 1, 3]} end={[trafficLightPosX + 0.5, 1, innerWidth / 2]} color="#ff6600" active={!isTrafficOccupied} />

            {/* Along bottom rail - split by train center if it lies on this long segment */}
            {
                <CircuitWire start={[trafficLightPosX + 0.5, 1, innerWidth / 2]} end={[0, 1, innerWidth / 2]} splitAtX={trainCenterX ?? undefined} batteryX={0} onColor="#ff6600" offColor="#333333" active={trainCenterX == undefined || isTrafficOccupied} />
            }

            {/* Global axes at world origin */}
            {/* <primitive object={new AxesHelper(20)} position={[0, 0, 0]} /> */}
        </>
    );
}

interface ATCProps {
    maxSpeed: number;
    sceneNumber: number;
}

export function Scene3D({ maxSpeed, sceneNumber }: ATCProps) {
    // Custom component to log camera position every frame
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
        <div className="w-full h-[600px]">
            <Canvas
                // [-10, 10, 0] [-Math.PI / 2, 0, 0]
                camera={sceneNumber > 0
                    ? { position: [-12, 11, 0], rotation: [-Math.PI / 2, 0, 0] } // Top-down view for Scene2
                    : { position: [13.90, 4.82, 7.01], rotation: [-0.47, 0.44, 0.21] } // Default view for Scene1
                }
                shadows
            >
                {/* <OrbitControls />
                <CameraLogger /> */}
                <>
                    {sceneNumber == 0 &&
                        <>
                            <ambientLight intensity={10} />
                            <directionalLight position={[10, 8, 8]} intensity={4.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                            <Scene1 maxSpeed={maxSpeed} />
                        </>
                    }
                    {sceneNumber > 0 &&
                        <>
                            <ambientLight intensity={10} />
                            <directionalLight position={[0, 10, 0]} intensity={4.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                            <Scene2 stepNumber={sceneNumber} />
                        </>
                    }
                </>
            </Canvas>
        </div>
    );
}
