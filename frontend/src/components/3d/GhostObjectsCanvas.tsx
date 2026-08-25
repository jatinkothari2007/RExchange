import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const GhostBook: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.2, 1.6, 0.3]} />
      <meshBasicMaterial color="#38BDF8" wireframe={true} transparent opacity={0.35} />
    </mesh>
  );
};

const GhostCalculator: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= delta * 0.3;
      meshRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.0, 1.8, 0.2]} />
      <meshBasicMaterial color="#F59E0B" wireframe={true} transparent opacity={0.3} />
    </mesh>
  );
};

const GhostTicket: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
      <meshBasicMaterial color="#10B981" wireframe={true} transparent opacity={0.3} />
    </mesh>
  );
};

export const GhostObjectsCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
          <GhostBook position={[-2.8, 1.2, 0]} />
          <GhostCalculator position={[2.8, -1.0, 0]} />
          <GhostTicket position={[2.2, 1.8, -1]} />
        </Float>
      </Canvas>
    </div>
  );
};
