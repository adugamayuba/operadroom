"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import type { AssetId, AssetKind, Severity } from "@/lib/demo/scenarios";
import { ASSETS, ASSET_LIST } from "@/lib/demo/scenarios";
import type { SystemMode } from "@/lib/demo/liveSystem";

const SEVERITY_COLOR: Record<Severity, string> = {
  advisory: "#6b7280",
  warning: "#9a3412",
  critical: "#991b1b",
};

function Pipe({ from, to, radius = 0.08 }: { from: [number, number, number]; to: [number, number, number]; radius?: number }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return (
    <mesh position={mid.toArray()} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 12]} />
      <meshStandardMaterial color="#8a9199" metalness={0.55} roughness={0.45} />
    </mesh>
  );
}

function Tank({ position, scale = 1, highlight = false }: { position: [number, number, number]; scale?: number; highlight?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2 * scale, 0]}>
        <cylinderGeometry args={[0.9 * scale, 0.9 * scale, 2.4 * scale, 24]} />
        <meshStandardMaterial color={highlight ? "#b45309" : "#9ca3af"} metalness={0.4} roughness={0.5} />
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
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, 0.8 + i * (height / 6), 0]}>
          <torusGeometry args={[0.72, 0.04, 8, 24]} />
          <meshStandardMaterial color="#787f88" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function FacilityScene({
  selectedId,
  severity,
  active,
  onAssetSelect,
}: {
  selectedId: AssetId;
  severity: Severity;
  active: boolean;
  onAssetSelect?: (id: AssetId) => void;
}) {
  const accent = active ? SEVERITY_COLOR[severity] : "#4b5563";

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[12, 18, 8]} intensity={1.1} castShadow />
      <directionalLight position={[-8, 10, -6]} intensity={0.35} />

      <Grid
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.4}
        sectionSize={5}
        sectionThickness={0.8}
        fadeDistance={35}
        fadeStrength={1}
        infiniteGrid
        position={[0, -0.01, 0]}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* CDU area */}
      <Column position={[-4, 0, -2]} height={6} />
      <Column position={[-1.5, 0, -2]} height={5.2} />
      <Tank position={[-6, 0, 2]} />
      <Tank position={[-3, 0, 3]} scale={0.85} />

      {/* FCC area */}
      <mesh position={[5, 1.2, 1]}>
        <boxGeometry args={[3.5, 2.4, 2.8]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.3} roughness={0.6} />
      </mesh>
      <Column position={[7, 0, -2]} height={4.5} />

      {/* Storage */}
      <Tank position={[2, 0, 5]} scale={1.1} />
      <Tank position={[5.5, 0, 5.5]} scale={1.2} />

      {/* Pipe rack */}
      <Pipe from={[-6, 1.5, 0]} to={[6, 1.5, 0]} />
      <Pipe from={[-6, 2.2, 1.5]} to={[6, 2.2, 1.5]} radius={0.06} />
      <Pipe from={[5, 2.5, 1]} to={[5, 2.5, 5]} />
      <Pipe from={[-4, 3, -2]} to={[-4, 3, 2]} />

      {/* Furnace block */}
      <mesh position={[-8, 1, -4]}>
        <boxGeometry args={[2.5, 2, 3]} />
        <meshStandardMaterial color="#787f88" metalness={0.35} roughness={0.65} />
      </mesh>
      <mesh position={[-8, 3.2, -4]}>
        <cylinderGeometry args={[0.25, 0.35, 2.5, 12]} />
        <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.5} />
      </mesh>

      {ASSET_LIST.map((asset) => {
        const selected = asset.id === selectedId;
        const { x, z } = asset.facilityPosition;
        return (
          <group key={asset.id} position={[x, 0.15, z]}>
            {selected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.45, 0.55, 32]} />
                <meshBasicMaterial color={active ? accent : "#374151"} transparent opacity={0.85} />
              </mesh>
            )}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onAssetSelect?.(asset.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <cylinderGeometry args={[selected ? 0.32 : 0.2, selected ? 0.32 : 0.2, 0.12, 16]} />
              <meshStandardMaterial
                color={selected ? (active ? accent : "#374151") : "#9ca3af"}
                emissive={selected && active ? accent : "#000000"}
                emissiveIntensity={selected && active ? 0.25 : 0}
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
            <Html distanceFactor={14} position={[0, 0.75, 0]} center style={{ pointerEvents: "none" }}>
              <button
                type="button"
                onClick={() => onAssetSelect?.(asset.id)}
                className={`px-1.5 py-0.5 text-[9px] whitespace-nowrap border cursor-pointer ${
                  selected
                    ? "border-[var(--demo-text)] bg-[var(--demo-bg)] text-[var(--demo-text)] font-semibold"
                    : "border-[var(--demo-border)] bg-[var(--demo-surface)] text-[var(--demo-muted)] hover:border-[var(--demo-muted)]"
                }`}
              >
                {asset.tag}
              </button>
            </Html>
          </group>
        );
      })}
    </>
  );
}

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
        <meshStandardMaterial color={accent} metalness={0.6} roughness={0.35} emissive={accent} emissiveIntensity={0.15} />
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
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.35} />
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
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.3} />
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
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.35, 0.2, 0.35]} />
        <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.5} />
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
      {[1, -1].map((x) =>
        [1, -1].map((z) => (
          <mesh key={`${x}-${z}`} position={[x * 0.9, 0.4, z * 0.9]}>
            <cylinderGeometry args={[0.08, 0.1, 0.8, 10]} />
            <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.55} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 3.05, 20]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function PipeModel({ accent }: { accent: string }) {
  return (
    <group>
      <Pipe from={[-2.5, 0.6, 0]} to={[2.5, 0.6, 0]} radius={0.14} />
      <Pipe from={[-2.5, 1.2, 0.4]} to={[2.5, 1.2, 0.4]} radius={0.1} />
      {[-2.5, 2.5].map((x) => (
        <mesh key={x} position={[x, 0.6, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          <meshStandardMaterial color="#8b919a" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 5.1, 12]} />
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.35} />
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
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.22} />
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
        <meshStandardMaterial color={accent} wireframe transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

function AssetModel({ kind, accent }: { kind: AssetKind; accent: string }) {
  switch (kind) {
    case "pump":
      return <PumpModel accent={accent} />;
    case "compressor":
      return <CompressorModel accent={accent} />;
    case "exchanger":
      return <ExchangerModel accent={accent} />;
    case "valve":
      return <ValveModel accent={accent} />;
    case "tank":
      return <TankAssetModel accent={accent} />;
    case "pipe":
      return <PipeModel accent={accent} />;
    case "column":
      return <ColumnAssetModel accent={accent} />;
    case "furnace":
      return <FurnaceModel accent={accent} />;
    default:
      return <PumpModel accent={accent} />;
  }
}

function AssetScene({
  kind,
  severity,
  active,
  tag,
}: {
  kind: AssetKind;
  severity: Severity;
  active: boolean;
  tag: string;
}) {
  const accent = active ? SEVERITY_COLOR[severity] : "#6b7280";
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 4]} intensity={1} />
      <directionalLight position={[-4, 4, -3]} intensity={0.3} />
      <Grid args={[10, 10]} cellSize={0.5} sectionSize={2} infiniteGrid fadeDistance={12} position={[0, 0, 0]} />
      <AssetModel kind={kind} accent={accent} />
      <Html position={[0, -0.2, 2.2]} center>
        <div className="px-2 py-1 text-[10px] border border-[var(--demo-border)] bg-[var(--demo-surface)] text-[var(--demo-text)]">
          {tag} · {kind} assembly
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
}: {
  view: "facility" | "asset";
  assetId: AssetId;
  assetKind: AssetKind;
  severity: Severity;
  active: boolean;
  facilityPosition: { x: number; z: number };
  onAssetSelect?: (id: AssetId) => void;
  mode?: SystemMode;
}) {
  const { theme } = useDemoTheme();
  const asset = ASSETS[assetId];
  const canvasBg = theme === "light" ? "#dce0e6" : "#141820";
  const incident = mode === "incident";

  return (
    <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }} style={{ touchAction: "none" }}>
      <fog attach="fog" args={[canvasBg, 18, 45]} />
      <color attach="background" args={[canvasBg]} />
      <PerspectiveCamera makeDefault position={view === "facility" ? [14, 12, 14] : [4, 3, 5]} fov={45} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={view === "facility" ? 8 : 2}
        maxDistance={view === "facility" ? 28 : 12}
        target={view === "facility" ? [facilityPosition.x, 1, facilityPosition.z] : [0, 0.8, 0]}
      />
      {view === "facility" ? (
        <FacilityScene selectedId={assetId} severity={severity} active={active || incident} onAssetSelect={onAssetSelect} />
      ) : (
        <AssetScene kind={assetKind} severity={severity} active={active || incident} tag={asset.tag} />
      )}
    </Canvas>
  );
}
