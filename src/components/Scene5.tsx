import { configureMeshVisibility, ANIMATION_CONSTANTS, SCENE_CONSTANTS, MODEL_PATH } from './Scene3D';
import { useFrame, useThree } from '@react-three/fiber';
import React, { JSX, useRef, useState, useEffect, createContext, useContext } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { gsap } from 'gsap';
import {
    Object3D,
    AnimationAction,
    Vector3,
    AnimationMixer,
} from "three";
import { Scene, AnimateVector } from './utils';
import { TimelineDescription } from './TimelineDescription';
import { ATCSpeedDisplay } from './SpeedDisplay';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { useSceneSpeed } from './Scene3';
import { addCenterLight } from './Scene1';
import { Tunnel } from './Tunnel';
import { Station } from './Station';
import { createReadStream } from 'fs';
import { PiecewisePlot } from './PiecewisePlot';

export class Scene5 implements Scene {

    readonly frameCount: number = 3;

    camera({ currentFrame }: { currentFrame: number }) {

        const cameraPositions = [
            {
                // Looking from front train 
                // Camera position: x=27.87, y=5.18, z=-0.32 | rotation (rad): x=-1.64, y=1.41, z=1.64
                position: { x: 27.87, y: 5.18, z: 0 } as { x: number; y: number; z: number; },
                rotation: { x: -Math.PI / 2, y: 1.41, z: Math.PI / 2 } as { x: number; y: number; z: number; },
            },
            {
                // looking at the train and tunnel from the side
                // Camera position: x=22.24, y=7.10, z=19.27 | rotation (rad): x=-0.07, y=0.01, z=0.00
                position: { x: 22.24, y: 7.10, z: 19.27 } as { x: number; y: number; z: number; },
                rotation: { x: -0.07, y: 0.01, z: 0.00 } as { x: number; y: number; z: number; },
            },
        ];

        const { camera } = useThree();
        const cameraSettingIndices = [0, 1, null];
        useEffect(() => {
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(camera.rotation);

            const targetIndex = cameraSettingIndices[currentFrame];
            if (targetIndex === null) {
                return;
            }
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
                <directionalLight
                    position={[10, 4, 8]}
                    intensity={2.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <directionalLight
                    position={[10, 4, -8]}
                    intensity={2.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
            </>
        );
    }

    objects({ currentFrame }: { currentFrame: number }) {

        const group = useRef<any>(null);
        const frontTrain = useRef<Object3D>(null);
        const mixersRef = useRef<AnimationMixer[]>([]);
        const axleActionsRef = useRef<AnimationAction[]>([]);

        const endingRef = useRef<Object3D>(null);
        const tunnelRef = useRef<any>(null);

        const { animations, scene } = useGLTF(MODEL_PATH);
        const { actions } = useAnimations(animations, scene);
        const { camera } = useThree();

        const train = scene.getObjectByName("train");
        const rails = scene.getObjectByName("rails");
        const empty = scene.getObjectByName("empty");

        const { speed, setSpeed, speedLimit, setSpeedLimit } = useSceneSpeed();
        const [railCopies, setRailCopies] = useState<number>(5);

        useEffect(() => {

            const addedObjects: Object3D[] = [];
            if (group.current) {
                group.current.scale.z = -1;
                group.current.position.y = 0;
            }

            if (empty) {
                configureMeshVisibility(empty, true);
                const light = addCenterLight(empty);
                const emptyCopy = empty.clone();
                emptyCopy.position.x = SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH * 2;

                const axlesClip = animations.filter(clip => clip.name.startsWith("axleAction"));
                if (axlesClip) {
                    axlesClip.forEach(clip => {
                        const mixer = new AnimationMixer(emptyCopy);
                        const action = mixer.clipAction(clip);
                        action.reset();
                        action.play();
                        mixersRef.current.push(mixer);
                        axleActionsRef.current.push(action); // BUG: adding it to both
                    });
                }

                frontTrain.current = emptyCopy;
                scene.add(emptyCopy);
                addedObjects.push(light, emptyCopy);
            }

            // Play axle animations
            if (actions) {
                const played: AnimationAction[] = [];
                Object.entries(actions).forEach(([key, action]) => {
                    if (action && key.startsWith("axleAction")) {
                        action.reset();
                        action.play();
                        played.push(action);
                        axleActionsRef.current.push(action);
                    }
                });

                return () => {
                    played.forEach((a) => a.stop());
                    addedObjects.forEach((obj) => scene.remove(obj));
                    if (empty) empty.position.set(0, 0, 0);
                    mixersRef.current.forEach((mixer) => mixer.stopAllAction());
                    mixersRef.current = [];
                };
            }

            return () => {
                if (empty) empty.position.set(0, 0, 0);
                addedObjects.forEach((obj) => scene.remove(obj));
                mixersRef.current.forEach((mixer) => mixer.stopAllAction());
                mixersRef.current = [];
            };
        }, []);

        useEffect(() => {

            const addedObjects: Object3D[] = [];
            // Update number of rail copies
            if (rails) {
                rails.visible = true;
                const sleepersClip = animations.find(clip => clip.name === "sleepersAction");
                for (let i = 0; i < railCopies; i++) {
                    const railsCopy = SkeletonUtils.clone(rails);
                    railsCopy.position.x = i * (SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH - 0.25);

                    if (sleepersClip) {
                        const mixer = new AnimationMixer(railsCopy);
                        const action = mixer.clipAction(sleepersClip);
                        action.reset();
                        action.play();
                        mixersRef.current.push(mixer);
                    }

                    scene.add(railsCopy);
                    addedObjects.push(railsCopy);
                }
                rails.visible = false;
            }

            return () => {
                addedObjects.forEach((obj) => scene.remove(obj));
                rails!.visible = true;
            }
        }, [railCopies, rails]);

        const [finsihedTraveling, setFinishedTraveling] = useState<boolean>(false);
        useEffect(() => {
            if (!empty) return;

            gsap.killTweensOf(empty.position);
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(camera.rotation);

            if (currentFrame === 0) {
                setSpeed(150);
                setSpeedLimit(160);
                gsap.set(empty.position, { x: 4 });
                tunnelRef.current.visible = false;
                if (frontTrain.current) {
                    frontTrain.current.visible = true;
                    frontTrain.current.position.setX(SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH * 2);
                }
            } else if (currentFrame === 1) {
                gsap.set(empty.position, { x: 4 });
                setSpeed(0);
                setRailCopies(5);
                tunnelRef.current.visible = true;
                if (frontTrain.current) frontTrain.current.visible = false;
            } else if (currentFrame === 2) {
                if (frontTrain.current) frontTrain.current.visible = false;
                if (empty.position.x < SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH) {
                    setSpeed(210);
                    setSpeedLimit(260);
                    setRailCopies(10);
                } else {
                    // Sitting at the station
                    // Camera position: x=201.14, y=4.89, z=15.58 | rotation (rad): x=-0.36, y=-0.02, z=-0.01
                    const endPos = { x: 201.14, y: 3.50, z: 10.58 };
                    const endRot = { x: 0, y: 0, z: 0 };
                    AnimateVector(camera.position, endPos, 2, (x, y, z) => camera.position.set(x, y, z));
                    AnimateVector(camera.rotation, endRot, 2, (x, y, z) => camera.rotation.set(x, y, z));

                    gsap.to(empty.position, {
                        x: (railCopies - 1) * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH,
                        duration: 4,
                        ease: "power1.out",
                        repeat: 0,
                    });

                    const speedObj = { speed: speed };

                    gsap.to(speedObj, {
                        speed: 0,
                        duration: 4,
                        ease: "power1.out",
                        repeat: 0,
                        onUpdate: () => { setSpeed(speedObj.speed); }
                    });
                }
            }

            return () => { gsap.killTweensOf(empty.position); gsap.killTweensOf(camera.position); gsap.killTweensOf(camera.rotation); }
        }, [currentFrame, finsihedTraveling]);

        useEffect(() => {
            const speedScale = speed / ANIMATION_CONSTANTS.BASE_SPEED_DIVISOR;
            mixersRef.current.forEach((mixer) => {
                mixer.timeScale = (finsihedTraveling) ? 0 : speedScale * ANIMATION_CONSTANTS.SPEED_MULTIPLIER;
            });

            axleActionsRef.current.forEach((action) => {
                action.setEffectiveTimeScale(speedScale);
            });
        }, [speed]);

        useFrame(({ clock }, delta) => {
            if (!train || !empty) return;

            mixersRef.current.forEach((mixer) => {
                mixer.update(delta);
            });

            if (currentFrame === 0) {
                // oscilate the train forwards and backwards
                const time = clock.getElapsedTime();
                empty.position.x = 4 + Math.sin(time * 1.5) * 4;
            } else if (currentFrame === 1) {
            } else if (currentFrame === 2) {
                // follow the train until it gets to the tunnel
                if (empty.position.x < 2 * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH) {
                    setFinishedTraveling(false);
                    empty.position.x += (speed / 10) * delta;
                } else if (empty.position.x < (railCopies - 2) * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH) {
                    empty.position.x += (speed / 10) * delta;

                    const worldPos = new Vector3();
                    train.getWorldPosition(worldPos);

                    const startYOffset = railCopies * 2;
                    const startZOffset = railCopies * 8;
                    const endYOffset = 4;
                    const endZOffset = 8;
                    const targetX = (railCopies - 2) * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH;

                    const tx = worldPos.x;
                    const xRatio = Math.max(0.001, (targetX - tx) / targetX);
                    const offset = { x: 0, y: startYOffset * xRatio + endYOffset * (1 - xRatio), z: startZOffset * xRatio + endZOffset * (1 - xRatio) };

                    camera.position.set(tx + offset.x, offset.y, offset.z);
                    camera.lookAt(tx, 0, 0);
                } else {
                    setFinishedTraveling(true);
                }
            }

        });

        return (
            <>
                <primitive ref={group} object={scene} />
                <group>
                    <mesh position={[railCopies * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH / 2 - SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[railCopies * (SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH + 1), 10]} />
                        <meshStandardMaterial color="grey" />
                    </mesh>

                    <group ref={endingRef} position={[(railCopies - 3) * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH, -0.4, 0]}>
                        <mesh ref={tunnelRef}>
                            <Tunnel
                                innerRadius={SCENE_CONSTANTS.RAIL_WIDTH}
                                outerRadius={SCENE_CONSTANTS.RAIL_WIDTH + 1}
                                wallHeight={3}
                                length={SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH}
                                rotation={[0, Math.PI / 2, 0]}
                            />
                            <group position={[0, 1.15, 0]}>
                                <Station
                                    position={[1.5 * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH, 0, -SCENE_CONSTANTS.RAIL_WIDTH * 1.5]}
                                    rotation={[0, Math.PI / 2, 0]}
                                    platformLength={20}
                                    platformWidth={6} />

                                <Station
                                    position={[1.5 * SCENE_CONSTANTS.RAIL_SEGMENT_LENGTH, 0, SCENE_CONSTANTS.RAIL_WIDTH * 1.5]}
                                    rotation={[0, Math.PI / 2, 0]}
                                    platformLength={20}
                                    platformWidth={6} />
                            </group>
                        </mesh>
                    </group>
                </group>
            </>
        );
    }

    description({ currentFrame }: { currentFrame: number; }): JSX.Element {

        const timelineSteps = [
            {
                title: "多段のブレーキ",
                description: ""
            },
            {
                title: "多段のブレーキ",
                description: ""
            },
            {
                title: "多段のブレーキ",
                description: ""
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
                    <PiecewisePlot
                        xAxisLabel="Time (s)"
                        yAxisLabel="Amplitude"
                        showAxes={true}
                        functions={[
                            {
                                segments: [
                                    { startX: 0, endX: 2, fn: (x) => x * x },
                                    { startX: 2, endX: 5, fn: (x) => 4 + (x - 2) },
                                    { startX: 5, endX: 10, fn: (x) => Math.sin(x) * 3 + 5 }
                                ],
                                color: '#C97A98',
                                label: 'Function 1'
                            },
                            {
                                segments: [
                                    { startX: 0, endX: 10, fn: (x) => Math.cos(x) * 2 + 3 }
                                ],
                                color: '#8B5A6F',
                                label: 'Function 2'
                            }
                        ]}
                        xRange={[0, 10]}
                        samplesPerSegment={50}
                        title="区分的関数"
                    />
                </div>
            </div>
        );
    }
}
