"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { createSeededRandom } from "@/lib/seededRandom";

const POINT_COUNT = 64;
const RADIUS = 6.5;

interface Node {
  position: [number, number, number];
  size: number;
  accent: boolean;
}

function buildGraph() {
  const random = createSeededRandom(7);
  const nodes: Node[] = [];

  for (let i = 0; i < POINT_COUNT; i++) {
    // Points distributed roughly on/near a sphere shell, like an
    // embedding cluster — not a uniform cube, so it reads as
    // intentional "space" rather than noise.
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = RADIUS * (0.55 + random() * 0.45);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    nodes.push({
      position: [x, y, z],
      size: 0.05 + random() * 0.09,
      accent: random() > 0.88,
    });
  }

  // Connect each node to its nearest couple of neighbors — an
  // approximation of what an HNSW graph actually looks like.
  const edges: [number, number][] = [];

  for (let i = 0; i < nodes.length; i++) {
    const distances = nodes
      .map((node, j) => ({
        j,
        d:
          i === j
            ? Infinity
            : Math.hypot(
                node.position[0] - nodes[i].position[0],
                node.position[1] - nodes[i].position[1],
                node.position[2] - nodes[i].position[2],
              ),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);

    for (const { j } of distances) {
      const key: [number, number] = i < j ? [i, j] : [j, i];
      if (!edges.some(([a, b]) => a === key[0] && b === key[1])) {
        edges.push(key);
      }
    }
  }

  return { nodes, edges };
}

function Graph() {
  const { nodes, edges } = useMemo(() => buildGraph(), []);
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.06;
    group.current.rotation.x = Math.sin(Date.now() * 0.00006) * 0.15;
  });

  return (
    <group ref={group}>
      {edges.map(([a, b], i) => (
        <Line
          key={i}
          points={[nodes[a].position, nodes[b].position]}
          color="#3a4258"
          transparent
          opacity={0.5}
          lineWidth={1}
        />
      ))}

      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[node.size, 12, 12]} />
          <meshBasicMaterial color={node.accent ? "#22d3ee" : "#8b93a7"} />
        </mesh>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} dpr={[1, 1.5]}>
        <Graph />
      </Canvas>
    </div>
  );
}
