import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { createContext, useContext, useRef, PropsWithChildren, useEffect, useState } from "react";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import { Object3D, AnimationAction, AnimationMixer, Mesh, AxesHelper, DoubleSide, Box3, Vector3, PointLight, MeshStandardMaterial } from "three";

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

interface ATCProps {
    maxSpeed: number;
}

export function Scene3D({ maxSpeed }: ATCProps) {
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
            <Canvas camera={{ position: [17.86, 5.44, 7.94], rotation: [-0.5, 0.74, 0.35] }} shadows>
                <ambientLight intensity={10} />
                <directionalLight position={[10, 8, 8]} intensity={4.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
                {/* <OrbitControls /> */}
                {/* <CameraLogger /> */}
                <Scene1 maxSpeed={maxSpeed} />
            </Canvas>
        </div>
    );
}
