import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface TokenProps {
  scrollYProgress: number; // 0.0 to 1.0 from scroll
}

const MainKarmaToken: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
      
      // Scale down as user scrolls and split tokens take over
      const scale = Math.max(0, 1.2 - scrollProgress * 1.5);
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* Low-poly icosahedron gold token */}
      <icosahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial
        color="#F59E0B"
        emissive="#D97706"
        emissiveIntensity={0.25}
        roughness={0.2}
        metalness={0.8}
        wireframe={false}
        flatShading={true}
      />
    </mesh>
  );
};

// Flying value shards that scatter as user scrolls
const ScatteredTokens: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  const count = 18;
  const shards = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.5 + Math.random() * 0.5;
      const radius = 2.5 + Math.random() * 3.5;
      const yOffset = (Math.random() - 0.5) * 4;
      return {
        id: i,
        basePos: [Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius] as [number, number, number],
        rotSpeed: [Math.random() * 2, Math.random() * 2, Math.random() * 2] as [number, number, number],
        size: 0.25 + Math.random() * 0.25,
      };
    });
  }, []);

  return (
    <group>
      {shards.map((shard) => (
        <ShardMesh key={shard.id} shard={shard} scrollProgress={scrollProgress} />
      ))}
    </group>
  );
};

const ShardMesh: React.FC<{ shard: any; scrollProgress: number }> = ({ shard, scrollProgress }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * shard.rotSpeed[0];
      meshRef.current.rotation.y += delta * shard.rotSpeed[1];

      // Move outwards as scroll progresses
      const distMultiplier = Math.min(2.5, scrollProgress * 3.0);
      meshRef.current.position.set(
        shard.basePos[0] * distMultiplier,
        shard.basePos[1] * distMultiplier,
        shard.basePos[2] * distMultiplier
      );

      const opacity = Math.min(1, scrollProgress * 2.0);
      meshRef.current.scale.setScalar(shard.size * (0.2 + opacity * 0.8));
    }
  });

  return (
    <mesh ref={meshRef} position={shard.basePos}>
      <octahedronGeometry args={[shard.size, 0]} />
      <meshStandardMaterial
        color="#FBBF24"
        emissive="#F59E0B"
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.7}
        flatShading={true}
      />
    </mesh>
  );
};

export const TokenScene: React.FC<TokenProps> = ({ scrollYProgress }) => {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#FBBF24" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#10B981" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <MainKarmaToken scrollProgress={scrollYProgress} />
          <ScatteredTokens scrollProgress={scrollYProgress} />
        </Float>
      </Canvas>
    </div>
  );
};
