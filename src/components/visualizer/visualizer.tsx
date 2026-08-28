"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Orbit,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CARS, COLOURS, DEFAULT_COLOUR, DEFAULT_FINISH, FINISHES } from "@/lib/visualizer";

/* ==================================================================
   THE HUD

   Everything floats over the car. The page does not scroll and there
   is no site chrome around it — the point is a room you are standing
   in, not a page you are reading.

   three.js cannot render on the server and weighs more than the rest
   of the site put together, so the scene is a separate chunk that
   only loads here.
   ================================================================== */

const CarScene = dynamic(() => import("./car-scene").then((m) => m.CarScene), {
  ssr: false,
});

/** How long the car stands still after you let go before it starts
 *  turning again on its own. */
const IDLE_MS = 7000;

export function Visualizer() {
  const [carIndex, setCarIndex] = useState(0);
  const [finishKey, setFinishKey] = useState(DEFAULT_FINISH.key);
  const [colourKey, setColourKey] = useState(DEFAULT_COLOUR.key);
  const [spinning, setSpinning] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const car = CARS[carIndex] ?? CARS[0];
  const finish = FINISHES.find((f) => f.key === finishKey) ?? DEFAULT_FINISH;
  const colour = COLOURS.find((c) => c.key === colourKey) ?? DEFAULT_COLOUR;

  const stage = useRef<HTMLDivElement>(null);
  const snapshot = useRef<(() => string) | null>(null);
  const bindSnapshot = useCallback((take: (() => string) | null) => {
    snapshot.current = take;
  }, []);

  /* Turning on its own reads as a showroom turntable, but it fights
     anyone who grabs the car. So it stops on touch and comes back
     once the car has been left alone for a while. */
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handOver = useCallback(() => {
    setSpinning(false);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setSpinning(true), IDLE_MS);
  }, []);
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  /* Fullscreen is changed by the browser too — Escape, the F11 key —
     so the button follows the document rather than its own state. */
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.current?.requestFullscreen?.();
  };

  const download = () => {
    const url = snapshot.current?.();
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `autotriz-${car.key}-${colour.key}-${finish.key}.png`;
    link.click();
  };

  const stepCar = (by: number) =>
    setCarIndex((i) => (i + by + CARS.length) % CARS.length);

  const stepFinish = (by: number) => {
    const at = FINISHES.findIndex((f) => f.key === finish.key);
    setFinishKey(FINISHES[(at + by + FINISHES.length) % FINISHES.length].key);
  };

  return (
    <div
      ref={stage}
      onPointerDown={handOver}
      onWheel={handOver}
      className="dark fixed inset-0 select-none overflow-hidden bg-[#050506] text-foreground"
    >
      {/* ============================================================
          THE ROOM BEHIND THE CAR
          Painted in HTML rather than in the scene: it stays crisp at
          any size and costs the renderer nothing.
          ============================================================ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_48%_at_50%_46%,#1c2026_0%,#0d1013_46%,#040405_100%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <Image
          src="/brand/autotriz-wordmark-light.png"
          alt=""
          width={1600}
          height={420}
          priority
          className="w-[min(74vw,60rem)] -translate-y-[14%] opacity-[0.045] mix-blend-screen"
        />
      </div>

      {/* The car itself. */}
      <CarScene
        car={car}
        finish={finish}
        colour={colour.hex}
        spinning={spinning}
        onSnapshotReady={bindSnapshot}
      />

      {/* Darkened corners, so the eye lands on the car. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_35%,rgba(0,0,0,0.55)_100%)]"
      />

      {/* ============================================================
          CONTROLS
          ============================================================ */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-7">
        {/* --- top ------------------------------------------------ */}
        <div className="flex items-start justify-between gap-4">
          <Link
            href="/"
            className="pointer-events-auto block shrink-0 transition-opacity hover:opacity-70"
            aria-label="AUTOTRIZ home"
          >
            <Image
              src="/brand/autotriz-wordmark-light.png"
              alt="AUTOTRIZ"
              width={640}
              height={168}
              priority
              className="h-8 w-auto md:h-10"
            />
          </Link>

          <div className="pointer-events-auto flex gap-2">
            <Tool label="Turn on its own" active={spinning} onClick={() => setSpinning((s) => !s)}>
              <Orbit className="size-4" />
            </Tool>
            <Tool label="About this finish" active={showInfo} onClick={() => setShowInfo((s) => !s)}>
              <Info className="size-4" />
            </Tool>
            <Tool label="Save a picture" onClick={download}>
              <Camera className="size-4" />
            </Tool>
            <Tool label={fullscreen ? "Leave fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Tool>
            <Link
              href="/"
              aria-label="Leave the visualizer"
              title="Leave the visualizer"
              className="pointer-events-auto grid size-10 place-items-center border border-white/15 bg-white/5 text-white/70 backdrop-blur transition-colors hover:border-white/40 hover:text-white"
            >
              <X className="size-4" />
            </Link>
          </div>
        </div>

        {/* --- what the finish is, when asked --------------------- */}
        <div
          className={cn(
            "pointer-events-none mx-auto max-w-md border border-white/10 bg-black/55 p-5 backdrop-blur-md transition-all duration-300",
            showInfo ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          <p className="label text-primary">{finish.short}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/75">{finish.blurb}</p>
          <p className="mt-4 border-t border-white/10 pt-3 text-[0.7rem] leading-relaxed text-white/35">
            A render is a guide, not a promise — the real result depends on the
            paint&apos;s condition and the correction done before coating.
            {car.credit ? ` ${car.credit}.` : null}
          </p>
        </div>

        {/* --- bottom --------------------------------------------- */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          {/* Coating and paint. */}
          <div className="pointer-events-auto min-w-0">
            <p className="label text-white/40">Protection</p>

            <div className="mt-2 flex items-center gap-3">
              <Tool label="Previous finish" onClick={() => stepFinish(-1)} small>
                <ChevronLeft className="size-4" />
              </Tool>
              <p className="display w-52 text-center text-lg text-white md:w-64 md:text-2xl">
                {finish.name}
              </p>
              <Tool label="Next finish" onClick={() => stepFinish(1)} small>
                <ChevronRight className="size-4" />
              </Tool>
            </div>

            <p className="label mt-5 text-white/40">
              Paint <span className="ml-2 text-white/70">{colour.name}</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {COLOURS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  title={item.name}
                  aria-label={item.name}
                  aria-pressed={item.key === colour.key}
                  onClick={() => setColourKey(item.key)}
                  className={cn(
                    "size-8 rounded-full border transition-transform md:size-9",
                    item.key === colour.key
                      ? "scale-110 border-primary ring-2 ring-primary/40"
                      : "border-white/25 hover:scale-105 hover:border-white/60",
                  )}
                  style={{ backgroundColor: item.hex }}
                />
              ))}
            </div>
          </div>

          {/* Which car. */}
          <div className="pointer-events-auto flex items-center gap-3 lg:shrink-0">
            <Tool label="Previous vehicle" onClick={() => stepCar(-1)} disabled={CARS.length < 2}>
              <ChevronLeft className="size-4" />
            </Tool>
            <div className="min-w-0 flex-1 text-left lg:w-44 lg:text-right">
              <p className="display-tight truncate text-sm text-white">{car.name}</p>
              <p className="mt-0.5 truncate text-xs text-white/40">
                {CARS.length > 1 ? `${carIndex + 1} of ${CARS.length} · ${car.note}` : car.note}
              </p>
            </div>
            <Tool label="Next vehicle" onClick={() => stepCar(1)} disabled={CARS.length < 2}>
              <ChevronRight className="size-4" />
            </Tool>
          </div>
        </div>
      </div>

      {/* Barely-there hint, bottom centre. */}
      <p className="label pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[0.6rem] text-white/20">
        Drag to turn · scroll to zoom
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Tool({
  children,
  label,
  onClick,
  active = false,
  disabled = false,
  small = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "pointer-events-auto grid shrink-0 place-items-center border backdrop-blur transition-colors",
        small ? "size-9" : "size-10",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-white/15 bg-white/5 text-white/70 hover:border-white/40 hover:text-white",
        disabled && "cursor-not-allowed opacity-25 hover:border-white/15 hover:text-white/70",
      )}
    >
      {children}
    </button>
  );
}
