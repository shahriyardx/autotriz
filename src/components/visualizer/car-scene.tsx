"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
  useProgress,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { CARS, type CarModel, type Finish } from "@/lib/visualizer";

/* ==================================================================
   THE STAGE

   A night photography studio: black room, a few soft light panels,
   a wet-looking floor. Nothing here is a photograph — the whole room
   is built from flat emissive rectangles, which is how car renders
   are lit for real.

   Reflections are the entire trick. Gloss and matte differ only in
   how roughly the clear coat scatters those panels back at you, so
   with no room to reflect, every coating would look the same.
   ================================================================== */

const DRACO = "/draco/";

/** Which slot a material in the file belongs to. Names the car lists
 *  win; anything else is guessed, so a model bought later still lands
 *  mostly in the right place without being described first. */
type Slot = "paint" | "glass" | "tyre" | "interior" | "keep";

function classify(name: string, car: CarModel): Slot {
  const n = name.trim().toLowerCase();
  if (car.paint.some((m) => m.toLowerCase() === n)) return "paint";
  if (/glass|windscreen|windshield|window/.test(n)) return "glass";
  if (/tyre|tire|rubber/.test(n)) return "tyre";
  if (/interior|leather|carpet|seat|dashboard|cockpit|upholster/.test(n)) return "interior";
  if (/body.?colou?r|car.?paint|paint|lackierung|karosserie/.test(n)) return "paint";
  return "keep";
}

/* ------------------------------------------------------------------ */

function Car({ car, finish, colour }: { car: CarModel; finish: Finish; colour: string }) {
  const { scene } = useGLTF(car.file, DRACO);

  /* Rebuilt when the coating or the colour changes rather than mutated
     in place. three caches a compiled shader by its feature set, so a
     rebuild with the same coating reuses the same program, and a
     colour is only a uniform — it costs nothing. */
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colour).convertSRGBToLinear(),
      metalness: finish.metalness,
      roughness: finish.roughness,
      clearcoat: finish.clearcoat,
      clearcoatRoughness: finish.clearcoatRoughness,
      envMapIntensity: finish.envIntensity,

      // The tricks, each off by default.
      sheen: finish.sheen ?? 0,
      sheenRoughness: finish.sheenRoughness ?? 0.5,
      sheenColor: new THREE.Color("#ffffff"),
      iridescence: finish.iridescence ?? 0,
      iridescenceIOR: 2,
      iridescenceThicknessRange: finish.iridescenceThickness ?? [100, 400],
      anisotropy: finish.anisotropy ?? 0,
    }),
    [colour, finish],
  );

  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#05070a"),
        metalness: 0.2,
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        transparent: true,
        opacity: 0.72,
        envMapIntensity: 1.6,
      }),
    [],
  );

  const tyre = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0b0b0c"),
        metalness: 0,
        roughness: 0.95,
        envMapIntensity: 0.35,
      }),
    [],
  );

  /* Cabins are often left a bright default grey by whoever built the
     model, which glows through the glass like a lightbox. A real one
     is the darkest part of the car. */
  const interior = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#14161a"),
        metalness: 0.1,
        roughness: 0.85,
        envMapIntensity: 0.5,
      }),
    [],
  );

  /* Swaps our materials in. The original name is gone the moment it is
     replaced, so which slot a mesh belongs to is worked out once and
     remembered on the mesh — a later pass would find nothing to match
     on otherwise. */
  useLayoutEffect(() => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;

      const known = mesh.userData.slot as Slot | undefined;
      const slot =
        known ??
        classify(
          Array.isArray(mesh.material)
            ? (mesh.material[0]?.name ?? "")
            : (mesh.material?.name ?? ""),
          car,
        );
      mesh.userData.slot = slot;

      if (slot === "paint") mesh.material = paint;
      else if (slot === "glass") mesh.material = glass;
      else if (slot === "tyre") mesh.material = tyre;
      else if (slot === "interior") mesh.material = interior;
    });
  }, [scene, car, paint, glass, tyre, interior]);

  /* Each material is thrown away with the render that owns it. The
     model itself is cached by the loader and left alone. */
  useEffect(() => () => paint.dispose(), [paint]);
  useEffect(() => () => glass.dispose(), [glass]);
  useEffect(() => () => tyre.dispose(), [tyre]);
  useEffect(() => () => interior.dispose(), [interior]);

  /* Models come with whatever pivot their maker used. Centring on the
     footprint and dropping the lowest point to the floor puts the
     wheels on the ground for every car, free or bought. */
  /* Every model is centred on the origin, sat on the floor and cut to
     life size by `scripts/prepare-car.mjs` before it is committed, so
     nothing needs measuring or moving here. */
  return <primitive object={scene} />;
}

/* ------------------------------------------------------------------
   THE ROOM

   Five soft panels: one overhead, one down each flank, one behind for
   the rim light along the roof, and a small warm one to pick up the
   brand's yellow in the paint. This is the whole environment — there
   is no photograph to download.
   ------------------------------------------------------------------ */

function Studio() {
  return (
    <Environment resolution={256}>
      {/* The room itself, so reflections do not fall away to pure black. */}
      <color attach="background" args={["#050506"]} />

      {/* Overhead key — the long highlight down the bonnet and roof. */}
      <Lightformer
        form="rect"
        intensity={6.5}
        position={[0, 7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 5, 1]}
      />

      {/* Flank strips — the line that runs the length of the body. */}
      <Lightformer
        form="rect"
        intensity={3.2}
        position={[-7, 3.5, 1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[16, 3.5, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.6}
        position={[7, 3.5, -1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[16, 3.5, 1]}
      />

      {/* Behind, to lift the roofline off the background. */}
      <Lightformer
        form="rect"
        intensity={2.4}
        position={[0, 3, -9]}
        rotation={[0, 0, 0]}
        scale={[9, 3, 1]}
      />

      {/* A soft front fill, so the nose is not left in shadow. */}
      <Lightformer
        form="ring"
        intensity={1.6}
        position={[-5, 2, 7]}
        scale={3.5}
      />
    </Environment>
  );
}

/* ------------------------------------------------------------------
   THE FLOOR

   Dark, matte, and printed with our own mark — the same trick a real
   studio uses to stop a seamless floor reading as empty grey. The
   pattern is drawn once onto a canvas rather than shipped as another
   image to download.
   ------------------------------------------------------------------ */

function Floor() {
  const logo = useTexture("/brand/autotriz-wordmark.png");

  const map = useMemo(() => {
    const source = logo.image as HTMLImageElement;
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#101215";
    ctx.fillRect(0, 0, size, size);

    /* The wordmark is yellow, which would tint the whole floor. Painted
       through its own shape first, it comes back as a flat grey
       silhouette — a mark pressed into the floor, not a sticker. */
    const width = size / 1.9;
    const height = width * (source.height / source.width);
    const stamp = document.createElement("canvas");
    stamp.width = Math.ceil(width);
    stamp.height = Math.ceil(height);
    const stampCtx = stamp.getContext("2d");
    if (!stampCtx) return null;
    stampCtx.drawImage(source, 0, 0, width, height);
    stampCtx.globalCompositeOperation = "source-in";
    stampCtx.fillStyle = "#9aa3ad";
    stampCtx.fillRect(0, 0, width, height);

    // Offset row by row, so the repeat does not read as a grid.
    ctx.globalAlpha = 0.05;
    for (let row = 0; row < 3; row++) {
      for (let column = -1; column < 3; column++) {
        ctx.drawImage(
          stamp,
          column * (size / 1.7) + (row % 2 ? size / 3.4 : 0),
          row * (size / 3) + size / 6 - height / 2,
          width,
          height,
        );
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [logo]);

  /* The floor has to stop somewhere, and a plane that stops leaves a
     horizon. Fading it away instead lets it run out into the dark, so
     there is no line to see. Its own mask, on its own scale — the mark
     above repeats, this must not. */
  const fade = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.16, "#ffffff");
    gradient.addColorStop(0.34, "#6a6a6a");
    gradient.addColorStop(0.5, "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  useEffect(() => () => map?.dispose(), [map]);
  useEffect(() => () => fade?.dispose(), [fade]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[64, 64]} />
      <meshStandardMaterial
        map={map}
        alphaMap={fade}
        transparent
        depthWrite={false}
        roughness={0.8}
        metalness={0.05}
        envMapIntensity={0.35}
      />
    </mesh>
  );
}

/* The softbox overhead, as a real object rather than only a
   reflection — in a studio you can see the light itself. */
function Softbox() {
  return (
    <mesh position={[0, 3.9, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[13, 7.5]} />
      {/* Unlit and outside tone mapping, so it stays the brightest
          white on screen instead of being rolled off with the rest. */}
      <meshBasicMaterial color="#ffffff" toneMapped={false} fog={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------
   A snapshot of exactly what is on screen. The renderer is asked to
   draw once more first, because the drawing buffer is otherwise
   cleared by the time we read it.
   ------------------------------------------------------------------ */

function Snapshot({ bind }: { bind: (take: (() => string) | null) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    bind(() => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    });
    return () => bind(null);
  }, [bind, gl, scene, camera]);

  return null;
}

/* ------------------------------------------------------------------ */

export type CarSceneProps = {
  car: CarModel;
  finish: Finish;
  colour: string;
  spinning: boolean;
  onSnapshotReady: (take: (() => string) | null) => void;
};

export function CarScene({ car, finish, colour, spinning, onSnapshotReady }: CarSceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: car.camera.position, fov: 36, near: 0.1, far: 120 }}
        gl={{
          antialias: true,
          // Needed so the camera button can read the pixels back.
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.22,
        }}
      >
        <Suspense fallback={null}>
          <Studio />
          <Softbox />
          <Car car={car} finish={finish} colour={colour} />
          <Floor />

          <ContactShadows
            position={[0, 0.004, 0]}
            opacity={0.85}
            scale={13}
            blur={1.7}
            far={2.6}
            resolution={1024}
            color="#000000"
          />
        </Suspense>

        <OrbitControls
          makeDefault
          target={car.camera.target}
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={car.distance.min}
          maxDistance={car.distance.max}
          // Stop the camera dropping through the floor.
          minPolarAngle={0.18}
          maxPolarAngle={Math.PI / 2 - 0.05}
          autoRotate={spinning}
          autoRotateSpeed={0.55}
        />

        <Snapshot bind={onSnapshotReady} />
      </Canvas>

      <LoadCurtain />
    </div>
  );
}

/* ------------------------------------------------------------------
   Covers the stage until the car has arrived.
   ------------------------------------------------------------------ */

function LoadCurtain() {
  const active = useProgress((s) => s.active);
  const progress = useProgress((s) => s.progress);

  return (
    <div
      aria-hidden={!active}
      className={`pointer-events-none absolute inset-0 grid place-items-center bg-[#050506] transition-opacity duration-700 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-60 text-center">
        <p className="label text-white/45">Rolling into the studio</p>
        <div className="mt-4 h-px w-full bg-white/15">
          <div
            className="h-px bg-primary transition-[width] duration-300"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* Warms the loader so the first visit is not a blank stage. */
for (const entry of CARS) useGLTF.preload(entry.file, DRACO);
