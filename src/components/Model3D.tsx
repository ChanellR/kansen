import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';

interface Model3DProps {
  modelType: string;
}

export function Model3D({ modelType }: Model3DProps) {
  const meshRef = useRef<any>(null);

  // Animate scale on model change
  const springs = useSpring({
    scale: 1,
    from: { scale: 0 },
    config: { tension: 200, friction: 20 }
  });

  // Subtle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  const renderModel = () => {
    const materialProps = {
      color: "#ffffff",
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 1
    };

    switch (modelType) {
      case 'sphere':
        return (
          <animated.mesh ref={meshRef} castShadow scale={springs.scale}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial {...materialProps} />
          </animated.mesh>
        );
      case 'torus':
        return (
          <animated.mesh ref={meshRef} castShadow scale={springs.scale}>
            <torusGeometry args={[1.2, 0.5, 16, 100]} />
            <meshStandardMaterial {...materialProps} />
          </animated.mesh>
        );
      case 'cone':
        return (
          <animated.mesh ref={meshRef} castShadow scale={springs.scale}>
            <coneGeometry args={[1.2, 2.5, 32]} />
            <meshStandardMaterial {...materialProps} />
          </animated.mesh>
        );
      default: // cube
        return (
          <animated.mesh ref={meshRef} castShadow scale={springs.scale}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial {...materialProps} />
          </animated.mesh>
        );
    }
  };

  return <>{renderModel()}</>;
}