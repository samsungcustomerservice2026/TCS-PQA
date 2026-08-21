'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus } from '@react-three/drei';

function OrbitalCore({ intensity = 'subtle' }) {
  const group = useRef(null);
  const strong = intensity === 'command';
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * (strong ? 0.18 : 0.08);
    group.current.rotation.x += delta * (strong ? 0.06 : 0.025);
  });

  return (
    <group ref={group} position={strong ? [1.15, 0.15, 0] : [1.6, 0.35, -0.4]} scale={strong ? 1 : 0.72}>
      <Float speed={strong ? 1.4 : 0.9} rotationIntensity={0.3} floatIntensity={strong ? 0.55 : 0.35}>
        <Sphere args={[1.05, 40, 40]}>
          <MeshDistortMaterial
            color="#1d4ed8"
            emissive="#2563eb"
            emissiveIntensity={strong ? 0.35 : 0.18}
            roughness={0.28}
            metalness={0.5}
            distort={strong ? 0.28 : 0.16}
            speed={1.2}
            transparent
            opacity={strong ? 0.55 : 0.32}
          />
        </Sphere>
      </Float>
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={0.25}>
        <Torus args={[1.55, strong ? 0.035 : 0.022, 14, 80]} rotation={[Math.PI / 2.6, 0.4, 0]}>
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#3b82f6"
            emissiveIntensity={strong ? 0.75 : 0.4}
            metalness={0.9}
            roughness={0.2}
          />
        </Torus>
      </Float>
      {strong ? (
        <Float speed={1.1} rotationIntensity={0.45} floatIntensity={0.4}>
          <Torus args={[1.95, 0.02, 12, 72]} rotation={[0.4, Math.PI / 3, 0.2]}>
            <meshStandardMaterial color="#a5b4fc" emissive="#6366f1" emissiveIntensity={0.45} metalness={0.85} roughness={0.25} />
          </Torus>
        </Float>
      ) : null}
    </group>
  );
}

function AmbientNodes({ intensity = 'subtle' }) {
  const count = intensity === 'command' ? 18 : 10;
  const nodes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        position: [
          Math.sin(i * 1.7) * (intensity === 'command' ? 3.2 : 3.8) - 0.2,
          Math.cos(i * 0.9) * (intensity === 'command' ? 1.8 : 2.2),
          -1.2 - (i % 5) * 0.4,
        ],
        scale: 0.025 + (i % 4) * 0.012,
      })),
    [count, intensity],
  );

  return (
    <group>
      {nodes.map((n) => (
        <mesh key={n.id} position={n.position} scale={n.scale}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={intensity === 'command' ? 1.1 : 0.55} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Shared SCORA WebGL atmosphere (client-only, after mount).
 * @param {'subtle'|'command'} intensity
 */
export default function ScoraAtmosphere3D({ intensity = 'subtle' }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const apply = () => setReduced(!!mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  if (reduced) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
        style={{
          background:
            intensity === 'command'
              ? 'radial-gradient(ellipse 70% 50% at 85% 18%, rgba(37,99,235,0.2), transparent 60%), radial-gradient(ellipse 45% 35% at 12% 82%, rgba(99,102,241,0.12), transparent 55%)'
              : 'radial-gradient(ellipse 55% 40% at 90% 10%, rgba(37,99,235,0.12), transparent 55%), radial-gradient(ellipse 40% 30% at 8% 90%, rgba(99,102,241,0.08), transparent 50%)',
        }}
      />
    );
  }

  const opacity = intensity === 'command' ? 0.7 : 0.38;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden style={{ opacity }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            intensity === 'command'
              ? 'radial-gradient(ellipse 60% 45% at 82% 12%, rgba(37,99,235,0.2), transparent 55%)'
              : 'radial-gradient(ellipse 50% 40% at 88% 8%, rgba(37,99,235,0.14), transparent 55%)',
        }}
      />
      <Canvas
        dpr={[1, 1.35]}
        camera={{ position: [0, 0, intensity === 'command' ? 5.2 : 5.8], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <ambientLight intensity={intensity === 'command' ? 0.35 : 0.22} />
        <directionalLight position={[4, 3, 5]} intensity={intensity === 'command' ? 1 : 0.65} color="#dbeafe" />
        <pointLight position={[-3, -1, 2]} intensity={0.45} color="#60a5fa" />
        <Suspense fallback={null}>
          <OrbitalCore intensity={intensity} />
          <AmbientNodes intensity={intensity} />
        </Suspense>
      </Canvas>
    </div>
  );
}
