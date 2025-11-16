import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MovingObject } from './MovingObject';

interface InteractiveSceneProps {
  maxSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function InteractiveScene({ maxSpeed, onSpeedChange }: InteractiveSceneProps) {
  return (
    <div className="w-full h-[600px]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 2, 8]} />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 5, 5]} intensity={0.5} color="#FFB3C6" />
        <pointLight position={[5, 5, -5]} intensity={0.3} color="#FFC2D4" />
        
        {/* Moving Object */}
        <MovingObject 
          maxSpeed={maxSpeed}
          onSpeedChange={onSpeedChange}
        />
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial 
            color="#FFE8EE" 
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>

        {/* Track markers */}
        <group>
          {Array.from({ length: 21 }).map((_, i) => (
            <mesh key={i} position={[(i - 10) * 1, 0.01, 0]}>
              <boxGeometry args={[0.1, 0.01, 1]} />
              <meshStandardMaterial color="#FFB3C6" opacity={0.5} transparent />
            </mesh>
          ))}
        </group>
      </Canvas>
    </div>
  );
}
