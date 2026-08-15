"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { OrbitControls, Line } from "@react-three/drei";
import type { ProjectionPoint } from "@/lib/api";

const SCALE = 10;

interface Props {
  points: ProjectionPoint[];
  queryCoord: { x: number; y: number; z: number } | null;
  highlightedIds: Set<number>;
  selectedId: number | null;
  onSelect: (point: ProjectionPoint) => void;
}

function CorpusPoint({
  point,
  highlighted,
  selected,
  onSelect,
}: {
  point: ProjectionPoint;
  highlighted: boolean;
  selected: boolean;
  onSelect: (point: ProjectionPoint) => void;
}) {
  const position: [number, number, number] = [
    point.x * SCALE,
    point.y * SCALE,
    point.z * SCALE,
  ];

  const color = selected ? "#facc15" : highlighted ? "#22d3ee" : "#525252";
  const radius = selected ? 0.22 : highlighted ? 0.16 : 0.09;

  return (
    <mesh
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(point);
      }}
    >
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function QueryMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshBasicMaterial color="#f472b6" />
      </mesh>
      <mesh>
        <ringGeometry args={[0.4, 0.46, 32]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.5} side={DoubleSide} />
      </mesh>
    </group>
  );
}

export default function VectorLabScene({
  points,
  queryCoord,
  highlightedIds,
  selectedId,
  onSelect,
}: Props) {
  const queryPosition: [number, number, number] | null = useMemo(() => {
    if (!queryCoord) return null;
    return [queryCoord.x * SCALE, queryCoord.y * SCALE, queryCoord.z * SCALE];
  }, [queryCoord]);

  return (
    <>
      <ambientLight intensity={1} />

      {points.map((point) => (
        <CorpusPoint
          key={point.id}
          point={point}
          highlighted={highlightedIds.has(point.id)}
          selected={point.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      {queryPosition && <QueryMarker position={queryPosition} />}

      {queryPosition &&
        points
          .filter((point) => highlightedIds.has(point.id))
          .map((point) => (
            <Line
              key={`line-${point.id}`}
              points={[
                queryPosition,
                [point.x * SCALE, point.y * SCALE, point.z * SCALE],
              ]}
              color="#f472b6"
              opacity={0.3}
              transparent
              lineWidth={1}
            />
          ))}

      <OrbitControls enableDamping dampingFactor={0.1} />
    </>
  );
}
