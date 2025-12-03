import { useMemo } from 'react';
import * as THREE from 'three';

interface TunnelProps {
    innerRadius?: number;
    outerRadius?: number;
    length?: number;
    wallHeight?: number;
    radialSegments?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    stationBoxDepth?: number;
    stationBoxWidth?: number;
    stationBoxHeight?: number;
}

export function Tunnel({
    innerRadius = 2,
    outerRadius = 3,
    length = 10,
    wallHeight = 2,
    radialSegments = 32,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    stationBoxDepth = 10,
    stationBoxWidth = 20,
    stationBoxHeight = 15,
}: TunnelProps) {

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();

        // Outer shape: semicircle on top with rectangular sides
        shape.moveTo(-outerRadius, wallHeight);
        shape.lineTo(-outerRadius, 0);
        shape.lineTo(outerRadius, 0);
        shape.lineTo(outerRadius, wallHeight);
        shape.absarc(0, wallHeight, outerRadius, 0, Math.PI, false);

        // Inner hole: semicircle on top with rectangular sides
        const hole = new THREE.Path();
        hole.moveTo(-innerRadius, wallHeight);
        hole.lineTo(-innerRadius, 0);
        hole.lineTo(innerRadius, 0);
        hole.lineTo(innerRadius, wallHeight);
        hole.absarc(0, wallHeight, innerRadius, 0, Math.PI, false);
        shape.holes.push(hole);

        // Extrude settings
        const extrudeSettings = {
            depth: length,
            bevelEnabled: false,
            curveSegments: radialSegments,
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [innerRadius, outerRadius, length, wallHeight, radialSegments]);

    return (
        <group position={position} rotation={rotation}>
            {/* Tunnel */}
            <mesh
                geometry={geometry}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial
                    color="rgba(85, 80, 80, 1)"
                    side={THREE.DoubleSide}
                    roughness={0.8}
                    metalness={0.2}
                />
            </mesh>
            
            {/* Station box at the back */}
            {/* <mesh
                position={[0, stationBoxHeight / 2, length + stationBoxDepth / 2]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[stationBoxWidth, stationBoxHeight, stationBoxDepth]} />
                <meshStandardMaterial
                    color="rgba(85, 80, 80, 1)"
                    side={THREE.DoubleSide}
                    roughness={0.7}
                    metalness={0.3}
                />
            </mesh> */}
        </group>
    );
}
