import { useMemo } from 'react';
import * as THREE from 'three';

interface StationProps {
    platformWidth?: number;
    platformLength?: number;
    platformHeight?: number;
    platformThickness?: number;
    roofHeight?: number;
    roofThickness?: number;
    roofOverhang?: number;
    pillarCount?: number;
    pillarRadius?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export function Station({
    platformWidth = 8,
    platformLength = 20,
    platformHeight = 0.5,
    platformThickness = 0.3,
    roofHeight = 4,
    roofThickness = 0.2,
    roofOverhang = 1,
    pillarCount = 6,
    pillarRadius = 0.15,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
}: StationProps) {

    // Calculate pillar positions - single row in the middle
    const pillars = useMemo(() => {
        const positions: [number, number, number][] = [];
        const spacing = platformLength / (pillarCount + 1);
        
        for (let i = 1; i <= pillarCount; i++) {
            const z = -platformLength / 2 + i * spacing;
            // Single row of pillars in the center, reaching to the roof peak
            positions.push([0, platformHeight + roofHeight / 2, z]);
        }
        
        return positions;
    }, [platformLength, platformHeight, roofHeight, pillarCount]);

    const pillarHeight = roofHeight;

    // Create curved roof geometry (V-shaped, like absolute value function)
    const roofGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        const halfWidth = (platformWidth + roofOverhang * 2) / 2;
        const peakHeight = roofHeight * 0.4; // Height of the peak above the roof base
        
        // Create V-shape cross-section
        shape.moveTo(-halfWidth, peakHeight); // Left edge, at base
        shape.lineTo(0, roofThickness); // Center peak
        shape.lineTo(halfWidth, peakHeight); // Right edge, at base
        shape.lineTo(halfWidth, peakHeight - roofThickness); // Right edge bottom
        shape.lineTo(0, 0); // Center bottom
        shape.lineTo(-halfWidth, peakHeight - roofThickness); // Left edge bottom
        shape.closePath();
        
        const extrudeSettings = {
            depth: platformLength + roofOverhang,
            bevelEnabled: false,
        };
        
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [platformWidth, platformLength, roofHeight, roofThickness, roofOverhang]);

    return (
        <group position={position} rotation={rotation}>
            {/* Platform */}
            <mesh
                position={[0, platformHeight / 2, 0]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[platformWidth, platformThickness, platformLength]} />
                <meshStandardMaterial
                    color="rgba(115, 115, 114, 1)"
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Support pillars */}
            {pillars.map((pillarPos, index) => (
                <mesh
                    key={index}
                    position={pillarPos}
                    castShadow
                    receiveShadow
                >
                    <cylinderGeometry args={[pillarRadius, pillarRadius, pillarHeight, 8]} />
                    <meshStandardMaterial
                        color="#505050"
                        roughness={0.6}
                        metalness={0.4}
                    />
                </mesh>
            ))}

            {/* Curved roof */}
            <mesh
                geometry={roofGeometry}
                position={[0, roofHeight + 0.3, -(platformLength + roofOverhang) / 2]}
                rotation={[0, 0, 0]}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial
                    color="rgba(61, 59, 59, 1)"
                    roughness={0.7}
                    metalness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}
