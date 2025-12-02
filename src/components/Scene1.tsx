import { ANIMATION_CONSTANTS, configureMeshVisibility, MODEL_PATH } from './Scene3D';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState, use, JSX } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Scene } from './utils';
import {
    Object3D,
    AnimationAction,
    PointLight,
    Vector3,
    Box3,
} from "three";
import { TimelineDescription } from './TimelineDescription';

/**
 * Adds a point light at the center of a 3D object
 */
export function addCenterLight(obj: Object3D, intensity = 2, distance = 10, decay = 2): PointLight {
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

export class Scene1 implements Scene {

    readonly frameCount = 1;

    camera({ currentFrame }: { currentFrame: number }) {
        const { camera } = useThree();

        const cameraPositions = [
            {    
                position: [13.9, 4.82, 7.01] as [number, number, number],
                rotation: [-0.47, 0.44, 0.21] as [number, number, number],
            }
        ];

        useEffect(() => {
            camera.position.set(...cameraPositions[currentFrame % cameraPositions.length].position);
            camera.rotation.set(...cameraPositions[currentFrame % cameraPositions.length].rotation);   
        }, []);
        
        return null;
    }

    lighting({ currentFrame }: { currentFrame: number }): JSX.Element {
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

    objects({ currentFrame }: { currentFrame: number }): JSX.Element {

        const group = useRef<any>(null);
        const [maxSpeed, setMaxSpeed] = useState<number>(180);
        
        const { animations, scene } = useGLTF(MODEL_PATH);
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

    description({ currentFrame }: { currentFrame: number; }): JSX.Element {
    
        const timelineSteps = [
            {
                title: "はじめに",
                description: "東海道新幹線の開発の時に、いろいろな注意するべきことがあって、事故を回避して安全で正確の乗り物を作ったら、高度のシステムを作って頼りにしなきゃなりません。この技術をインターアクティブなアニメーションによる説明してみます。まず、「ＡＴＣ」というシステムに集中します。このシステムは新幹線の運転士に許容速度を表示して、列車がその限界を超過した場合は自動的に減速させる機械を持っています。\n「自動列車制御装置」は新幹線の開業当初から大分進化してきましたが、その前にある繋がっている技術とシステムや当時の状態を発表します！"
            }
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
