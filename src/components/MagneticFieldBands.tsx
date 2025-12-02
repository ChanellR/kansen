import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MagneticFieldBandsProps {
    /** Position of the wire (center line) */
    position?: [number, number, number];
    /** Direction vector of the wire */
    wireDirection?: [number, number, number];
    /** Number of bands to render */
    bandCount?: number;
    /** Spacing between bands along the wire */
    bandSpacing?: number;
    /** Base radius of the bands */
    baseRadius?: number;
    /** Amplitude of radius oscillation */
    radiusAmplitude?: number;
    /** Speed of radius oscillation */
    animationSpeed?: number;
    ccwcolor?: string;
    cwcolor?: string;
    /** Opacity of the bands */
    opacity?: number;
    /** Thickness of each band */
    bandThickness?: number;
    /** Whether to show directional arrows */
    showArrows?: boolean;
    /** Arrow color */
    arrowColor?: string;
}

export default function MagneticFieldBands({
    position = [0, 0, 0],
    wireDirection = [1, 0, 0],
    bandCount = 5,
    bandSpacing = 2,
    baseRadius = 1.5,
    radiusAmplitude = 0.3,
    animationSpeed = 1,
    cwcolor = 'rgba(18, 67, 99, 1)',
    ccwcolor = 'rgba(117, 53, 53, 1)',
    opacity = 0.6,
    bandThickness = 0.1,
    showArrows = true,
    arrowColor = '#ffff00',
}: MagneticFieldBandsProps) {
    const groupRef = useRef<THREE.Group>(null);
    const bandsRef = useRef<THREE.Mesh[]>([]);

    // Normalize wire direction
    const normalizedDirection = useMemo(() => {
        const dir = new THREE.Vector3(...wireDirection);
        return dir.normalize();
    }, [wireDirection]);

    // Calculate rotation to align bands perpendicular to wire
    const bandRotation = useMemo(() => {
        const dir = normalizedDirection.clone();
        const up = new THREE.Vector3(0, 0, 1);

        // If direction is parallel to z-axis, use different up vector
        if (Math.abs(dir.dot(up)) > 0.99) {
            up.set(0, 1, 0);
        }

        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(up, dir);

        const euler = new THREE.Euler();
        euler.setFromQuaternion(quaternion);

        return euler;
    }, [normalizedDirection]);

    // Animate band radii
    const [fieldOrientation, setFieldOrientation] = useState<'clockwise' | 'counterclockwise'>('clockwise');
    useFrame(({ clock }) => {
        const time = clock.getElapsedTime() * animationSpeed;

        bandsRef.current.forEach((band, index) => {
            if (band) {
                // Phase offset for each band creates wave effect
                const radius = Math.sin(time) * radiusAmplitude;
                if (radius >= 0) {
                    setFieldOrientation('clockwise');
                } else {
                    setFieldOrientation('counterclockwise');
                }
                band.scale.x = radius;
                band.scale.y = radius;
            }
        });
    });


    // Create arrow geometry for field direction
    const arrowGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        const arrowSize = 0.075;
        const arrowLength = 0.15;

        // Create a curved arrow pointing clockwise
        shape.moveTo(0, 0);
        shape.lineTo(arrowLength, 0);
        shape.lineTo(arrowLength - arrowSize, arrowSize);
        shape.moveTo(arrowLength, 0);
        shape.lineTo(arrowLength - arrowSize, -arrowSize);

        return new THREE.ShapeGeometry(shape);
    }, []);

    return (
        <group ref={groupRef} position={position}>
            {Array.from({ length: bandCount }).map((_, index) => {
                // Position along wire
                const offset = (index - (bandCount - 1) / 2) * bandSpacing;
                const bandPosition = normalizedDirection
                    .clone()
                    .multiplyScalar(offset)
                    .toArray();

                return (
                    <group key={index} position={bandPosition}>
                        {/* Cylindrical band (torus) */}
                        <mesh
                            ref={(el) => {
                                if (el) bandsRef.current[index] = el;
                            }}
                            rotation={[bandRotation.x, bandRotation.y, bandRotation.z]}
                        >
                            <torusGeometry args={[1, bandThickness, 16, 64]} />
                            <meshStandardMaterial
                                color={fieldOrientation === 'clockwise' ? cwcolor : ccwcolor}
                                transparent
                                opacity={opacity}
                                side={THREE.DoubleSide}
                                emissive={fieldOrientation === 'clockwise' ? cwcolor : ccwcolor}
                                emissiveIntensity={0.2}
                            />
                        </mesh>

                        {/* Directional arrows */}
                        {showArrows && (
                            <>
                                {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, arrowIndex) => (
                                    <group
                                        key={arrowIndex}
                                        rotation={[bandRotation.x, bandRotation.y, bandRotation.z + angle]}
                                    >
                                        <mesh
                                            position={[baseRadius, 0, 0]}
                                            rotation={[0, 0, Math.PI * (fieldOrientation === 'clockwise' ? 0 : 1)]}
                                            geometry={arrowGeometry}
                                        >
                                            <meshBasicMaterial color={arrowColor} side={THREE.DoubleSide} />
                                        </mesh>
                                    </group>
                                ))}
                            </>
                        )}
                    </group>
                );
            })}
        </group>
    );
}
