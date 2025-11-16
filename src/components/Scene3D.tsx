import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { createContext, useContext, useRef, PropsWithChildren, useEffect, useState } from "react";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import { Object3D, AnimationAction, AnimationMixer, Mesh, AxesHelper, DoubleSide, Box3, Vector3, PointLight, MeshStandardMaterial } from "three";
import gsap from 'gsap';

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

function CircuitWire({ start, end, color = "#ffaa00" }: { start: [number, number, number], end: [number, number, number], color?: string }) {
    const direction = new Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
    const length = direction.length();
    const midpoint: [number, number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2
    ];
    console.log(`midpoint: ${midpoint}, length: ${length}`);
    // Calculate rotation to align cylinder with direction
    const axis = new Vector3(0, 1, 0);
    direction.normalize();
    const quaternion = new Vector3().setFromMatrixColumn(
        new Vector3(0, 1, 0).applyAxisAngle(
            new Vector3().crossVectors(axis, direction).normalize(),
            Math.acos(axis.dot(direction))
        ) as any,
        0
    );

    return (
        <mesh position={midpoint} rotation={[Math.PI / 2, 0, Math.atan2(end[2] - start[2], end[0] - start[0])]}>
            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
            <meshStandardMaterial color={color} />
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

    }, [actions]);

    // GSAP animations based on stepNumber
    useEffect(() => {
        if (!empty) return;

        // Kill any existing animations on the empty object
        gsap.killTweensOf(empty.position);

        if (stepNumber === 1) {
            // Step 1: Position at -30
            gsap.set(empty.position, { x: -25 });
        } else if (stepNumber === 2) {
            // Step 2: Loop from -30 to 0
            gsap.set(empty.position, { x: -30 });
            gsap.to(empty.position, {
                x: 0,
                duration: 2,
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
            gsap.set(empty.position, { x: 0 });
            gsap.to(empty.position, {
                x: 35,
                duration: 2,
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

    return (
        <>
            <primitive ref={group} object={scene} />
            <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[90, 10]} />
                <meshStandardMaterial color="grey" />
            </mesh>
            
            {/* Circuit visualization */}
            {/* Battery on the right */}
            <Battery position={[0, 1, 3]} />
            
            {/* Traffic light on the left */}
            <TrafficLight position={[-21, 1, 3]} isGreen={stepNumber !== 2} />
            
            {/* Circuit wires - creating a loop */}
            {/* From battery positive to right rail */}
            {/* <CircuitWire start={[0, 1, 3]} end={[0, 1, -3]} color="#ff6600" /> */}
            {/* Right rail segment (represented as wire) */}
            {/* <CircuitWire start={[11, 0, 0]} end={[-11, 0, 0]} color="#ffaa00" /> */}
            {/* From left rail to traffic light */}
            {/* <CircuitWire start={[-11, 0, 0]} end={[-12, -0.5, 2]} color="#ff6600" /> */}
            {/* From traffic light back to battery negative */}
            {/* <CircuitWire start={[-12, 0.5, 2]} end={[12, 0.3, 2]} color="#0066ff" /> */}
            
            {/* Rail circuit indicators - small boxes on the rails */}
            {/* <mesh position={[0, 0.1, 0.3]}>
                <boxGeometry args={[23, 0.05, 0.3]} />
                <meshStandardMaterial color="#ffaa00" transparent opacity={0.6} />
            </mesh> */}
            
            {/* Global axes at world origin */}
            <primitive object={new AxesHelper(20)} position={[0, 0, 0]} />
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
                    : { position: [17.86, 5.44, 7.94], rotation: [-0.5, 0.74, 0.35] } // Default view for Scene1
                } 
                shadows
            >
                <OrbitControls />
                {/* <CameraLogger /> */}
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
