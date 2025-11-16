import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';

interface MovingObjectProps {
  maxSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function MovingObject({ maxSpeed, onSpeedChange }: MovingObjectProps) {
  const meshRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const lastPositionRef = useRef(0);
  const positionRef = useRef(0);
  
  const { viewport } = useThree();

  const [spring, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 20 }
  }));

  useFrame((state, delta) => {
    if (meshRef.current && !isDragging) {
      // Apply velocity
      positionRef.current += velocity * delta;
      
      // Clamp position to track bounds
      if (positionRef.current > 10) {
        positionRef.current = 10;
        setVelocity(-velocity * 0.8); // Bounce back
      } else if (positionRef.current < -10) {
        positionRef.current = -10;
        setVelocity(-velocity * 0.8); // Bounce back
      }
      
      meshRef.current.position.x = positionRef.current;
      
      // Apply friction
      setVelocity(v => v * 0.98);
      
      // Calculate and report speed
      const speed = Math.abs(velocity);
      onSpeedChange(parseFloat(speed.toFixed(2)));
      
      // Add floating animation
      meshRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    lastPositionRef.current = e.point.x;
    api.start({ scale: 1.2 });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    api.start({ scale: 1 });
  };

  const handlePointerMove = (e: any) => {
    if (isDragging) {
      const newX = Math.max(-10, Math.min(10, e.point.x));
      const deltaX = newX - lastPositionRef.current;
      
      // Calculate velocity based on drag speed
      const newVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, deltaX * 20));
      setVelocity(newVelocity);
      
      positionRef.current = newX;
      if (meshRef.current) {
        meshRef.current.position.x = newX;
      }
      lastPositionRef.current = newX;
    }
  };

  return (
    <animated.mesh
      ref={meshRef}
      position={[0, 1, 0]}
      castShadow
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerUp}
      scale={spring.scale}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color="#ffffff" 
        metalness={0.4}
        roughness={0.3}
        emissive="#FFB3C6"
        emissiveIntensity={0.2}
      />
      
      {/* Speed trail effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.52, 16, 16]} />
        <meshBasicMaterial 
          color="#FFC2D4" 
          transparent 
          opacity={0.3}
          wireframe
        />
      </mesh>
    </animated.mesh>
  );
}
