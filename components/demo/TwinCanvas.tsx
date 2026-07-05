"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import type { AssetId, AssetKind, AssetScenario, Severity } from "@/lib/demo/scenarios";
import { ASSETS, ASSET_LIST } from "@/lib/demo/scenarios";
import type { MarkerStatus, SystemMode } from "@/lib/demo/liveSystem";

const STATUS_COLOR: Record<MarkerStatus, string> = {
  normal: "#6b7280",
  selected: "#1e4976",
  incident: "#9a6700",
  breached: "#9b2c2c",
};

function Pipe({ from, to, radius = 0.08 }: { from: [number, number, number]; to: [number, number, number]; radius?: number }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={mid.toArray()} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 12]} />
      <meshStandardMaterial color="#8a9199" metalness={0.55} roughness={0.45} />
    </mesh>
  );
}

function Tank({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2 * scale, 0]}>
        <cylinderGeometry args={[0.9 * scale, 0.9 * scale, 2.4 * scale, 24]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.5 * scale, 0]}>
        <sphereGeometry args={[0.35 * scale, 16, 16]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Column({ position, height = 5 }: { position: [number, number, number]; height?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.55, 0.7, height, 20]} />
        <meshStandardMaterial color="#a8adb5" metalness={0.35} roughness={0.55} />
      </mesh>
    </group>
  );
}

function ClickableAssetMarker({
  asset,
  status,
  onSelect,
}: {
  asset: AssetScenario;
  status: MarkerStatus;
  onSelect: (id: AssetId) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { x, z } = asset.facilityPosition;
  const color = STATUS_COLOR[status];
  const isActive = status === "selected" || status === "incident" || status === "breached";

  const handleSelect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(asset.id);
  };

  return (
    <group position={[x, 0.2, z]}>
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.5, 0.62, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      )}

      {/* Large invisible hit target — always raycastable */}
      <mesh
        position={[0, 0.55, 0]}
        onPointerDown={handleSelect}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.75, 12, 12]} />
        <meshBasicMaterial transparent opacity={hovered ? 0.12 : 0.02} depthWrite={false} color={color} />
      </mesh>

      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.24, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={status === "breached" ? color : "#000000"}
          emissiveIntensity={status === "breached" ? 0.4 : 0}
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* Live monitoring pulse on all assets */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={status === "breached" ? color : "#6b7280"} />
      </mesh>

      <Html center distanceFactor={11} position={[0, 1.05, 0]} zIndexRange={[100, 0]} transform sprite={false}>
        <div
          role="button"
          tabIndex={0}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSelect(asset.id);
          }}
          onKeyDown={(e) => e.key === "Enter" && onSelect(asset.id)}
          className={`cursor-pointer select-none px-2 py-1 text-[10px] font-medium whitespace-nowrap border shadow-sm transition-transform ${
            isActive
              ? "border-[var(--demo-text)] bg-[var(--demo-bg)] text-[var(--demo-text)] scale-105"
              : "border-[var(--demo-border)] bg-[var(--demo-surface)] text-[var(--demo-muted)] hover:border-[var(--demo-text)] hover:scale-105"
          } ${hovered ? "scale-110" : ""}`}
        >
          {asset.tag}
        </div>
      </Html>
    </group>
  );
}

function FacilityScene({
  markerStatuses,
  onAssetSelect,
}: {
  markerStatuses: Record<AssetId, MarkerStatus>;
  onAssetSelect?: (id: AssetId) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[12, 18, 8]} intensity={1.15} castShadow />
      <directionalLight position={[-8, 10, -6]} intensity={0.4} />
      <hemisphereLight args={["#f0f4f8", "#8891a0", 0.35]} />

      <Grid args={[40, 40]} cellSize={1} cellThickness={0.35} sectionSize={5} sectionThickness={0.7} fadeDistance={35} infiniteGrid position={[0, 0, 0]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#c5cad1" roughness={0.92} metalness={0.08} />
      </mesh>

      <Column position={[-4, 0, -2]} height={6} />
      <Column position={[-1.5, 0, -2]} height={5.2} />
      <Tank position={[-6, 0, 2]} />
      <Tank position={[-3, 0, 3]} scale={0.85} />
      <mesh position={[5, 1.2, 1]}>
        <boxGeometry args={[3.5, 2.4, 2.8]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.3} roughness={0.6} />
      </mesh>
      <Column position={[7, 0, -2]} height={4.5} />
      <Tank position={[2, 0, 5]} scale={1.1} />
      <Tank position={[5.5, 0, 5.5]} scale={1.2} />
      <Pipe from={[-6, 1.5, 0]} to={[6, 1.5, 0]} />
      <Pipe from={[-6, 2.2, 1.5]} to={[6, 2.2, 1.5]} radius={0.06} />
      <Pipe from={[5, 2.5, 1]} to={[5, 2.5, 5]} />
      <Pipe from={[-4, 3, -2]} to={[-4, 3, 2]} />
      <mesh position={[-8, 1, -4]}>
        <boxGeometry args={[2.5, 2, 3]} />
        <meshStandardMaterial color="#787f88" metalness={0.35} roughness={0.65} />
      </mesh>
      <mesh position={[-8, 3.2, -4]}>
        <cylinderGeometry args={[0.25, 0.35, 2.5, 12]} />
        <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.5} />
      </mesh>

      {ASSET_LIST.map((asset) => (
        <ClickableAssetMarker
          key={asset.id}
          asset={asset}
          status={markerStatuses[asset.id] ?? "normal"}
          onSelect={(id) => onAssetSelect?.(id)}
        />
      ))}
    </>
  );
}

/* Asset model components unchanged below — PumpModel through AssetScene */
function PumpModel({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.7, 24]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[0.85, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.9, 20]} />
        <meshStandardMaterial color="#a8adb5" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-0.75, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.5, 16]} />
        <meshStandardMaterial color="#8b919a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <torusGeometry args={[0.52, 0.05, 8, 24]} />
        <meshStandardMaterial color={accent} metalness={0.6} roughness={0.35} emissive={accent} emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

function CompressorModel({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.2, 1.6, 1.4]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.4} roughness={0.5} />
      </mesh>
      <Pipe from={[-1.4, 0.8, 0]} to={[-2.2, 0.8, 0]} />
      <Pipe from={[1.4, 0.8, 0]} to={[2.2, 0.8, 0]} />
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.3, 1.7, 1.5]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function ExchangerModel({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 2.8, 20]} />
        <meshStandardMaterial color="#a8adb5" metalness={0.45} roughness={0.45} />
      </mesh>
      {[1.5, -1.5].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.15, 20]} />
          <meshStandardMaterial color="#8b919a" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.44, 0.44, 2.85, 16]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function ValveModel({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.45} roughness={0.45} />
      </mesh>
      <Pipe from={[-1.2, 0.5, 0]} to={[-0.35, 0.5, 0]} />
      <Pipe from={[0.35, 0.5, 0]} to={[1.2, 0.5, 0]} />
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.7, 12]} />
        <meshStandardMaterial color={accent} metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function TankAssetModel({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 3, 28]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#787f88" metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 3.05, 20]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function PipeModel({ accent }: { accent: string }) {
  return (
    <group>
      <Pipe from={[-2.5, 0.6, 0]} to={[2.5, 0.6, 0]} radius={0.14} />
      <Pipe from={[-2.5, 1.2, 0.4]} to={[2.5, 1.2, 0.4]} radius={0.1} />
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 5.1, 12]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function ColumnAssetModel({ accent }: { accent: string }) {
  return (
    <group>
      <Column position={[0, 0, 0]} height={5.5} />
      <mesh position={[0, 2.75, 0]}>
        <cylinderGeometry args={[0.73, 0.73, 5.6, 16]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function FurnaceModel({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.8, 2, 3.5]} />
        <meshStandardMaterial color="#787f88" metalness={0.35} roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.3, 0.45, 2.8, 14]} />
        <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.5} />
      </mesh>
      <Pipe from={[-2, 1, 0]} to={[-3, 1, 0]} />
      <Pipe from={[2, 1, 0]} to={[3, 1, 0]} />
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.85, 2.05, 3.55]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function AssetModel({ kind, accent }: { kind: AssetKind; accent: string }) {
  const map: Record<AssetKind, React.ReactNode> = {
    pump: <PumpModel accent={accent} />,
    compressor: <CompressorModel accent={accent} />,
    exchanger: <ExchangerModel accent={accent} />,
    valve: <ValveModel accent={accent} />,
    tank: <TankAssetModel accent={accent} />,
    pipe: <PipeModel accent={accent} />,
    column: <ColumnAssetModel accent={accent} />,
    furnace: <FurnaceModel accent={accent} />,
  };
  return <>{map[kind]}</>;
}

function AssetScene({ kind, severity, active, tag }: { kind: AssetKind; severity: Severity; active: boolean; tag: string }) {
  const accent = active ? STATUS_COLOR.breached : "#6b7280";
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 4]} intensity={1.05} />
      <directionalLight position={[-4, 4, -3]} intensity={0.35} />
      <Grid args={[10, 10]} cellSize={0.5} sectionSize={2} infiniteGrid fadeDistance={12} />
      <AssetModel kind={kind} accent={accent} />
      <Html position={[0, -0.2, 2.2]} center>
        <div className="px-2 py-1 text-[10px] border border-[var(--demo-border)] bg-[var(--demo-surface)] text-[var(--demo-text)]">
          {tag}
        </div>
      </Html>
    </>
  );
}

export function TwinCanvas({
  view,
  assetId,
  assetKind,
  severity,
  active,
  facilityPosition,
  onAssetSelect,
  mode,
  markerStatuses,
}: {
  view: "facility" | "asset";
  assetId: AssetId;
  assetKind: AssetKind;
  severity: Severity;
  active: boolean;
  facilityPosition: { x: number; z: number };
  onAssetSelect?: (id: AssetId) => void;
  mode?: SystemMode;
  markerStatuses: Record<AssetId, MarkerStatus>;
}) {
  const { theme } = useDemoTheme();
  const asset = ASSETS[assetId];
  const canvasBg = theme === "light" ? "#d4d9e0" : "#12151a";

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      style={{ touchAction: "none", width: "100%", height: "100%" }}
      eventPrefix="client"
    >
      <fog attach="fog" args={[canvasBg, 20, 48]} />
      <color attach="background" args={[canvasBg]} />
      <PerspectiveCamera makeDefault position={view === "facility" ? [15, 13, 15] : [4, 3, 5]} fov={42} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={view === "facility" ? 7 : 2}
        maxDistance={view === "facility" ? 30 : 12}
        target={view === "facility" ? [facilityPosition.x, 0.8, facilityPosition.z] : [0, 0.8, 0]}
      />
      {view === "facility" ? (
        <FacilityScene markerStatuses={markerStatuses} onAssetSelect={onAssetSelect} />
      ) : (
        <AssetScene kind={assetKind} severity={severity} active={active || mode === "incident"} tag={asset.tag} />
      )}
    </Canvas>
  );
}
