import { GameEngine } from "./engine/core/GameEngine.js?v=5";
import { CanvasRenderer } from "./engine/graphics/CanvasRenderer.js?v=5";
import { SceneManager } from "./engine/scenes/SceneManager.js?v=4";
import { AssetManager } from "./engine/assets/AssetManager.js?v=4";
import { InputManager } from "./engine/input/InputManager.js?v=5";
import { EventBus } from "./engine/events/EventBus.js?v=4";
import { DebugOverlay } from "./engine/debug/DebugOverlay.js?v=5";
import { TestScene } from "./scenes/TestScene.js?v=4";
import { WastelandScene } from "./scenes/WastelandScene.js?v=9";

const canvas = document.querySelector("#game-canvas");
const joystick = document.querySelector("#joystick");
const joystickKnob = document.querySelector("#joystick-knob");
const renderer = new CanvasRenderer(canvas);
const events = new EventBus();
const assets = new AssetManager();
const input = new InputManager(canvas, joystick, joystickKnob);
const scenes = new SceneManager({ renderer, input, events, assets });
const debug = new DebugOverlay();
const engine = new GameEngine({ renderer, scenes, input, events, debug });

const status = document.querySelector("#engine-status");
const pauseButton = document.querySelector("#pause-button");
const sceneButton = document.querySelector("#scene-button");
const debugButton = document.querySelector("#debug-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const appShell = document.querySelector(".app-shell");

events.on("engine:ready", () => { status.textContent = "EN EJECUCIÓN"; });
events.on("scene:changed", ({ name }) => {
  document.querySelector("#scene-value").textContent = name;
  const label = document.querySelector("#scene-overlay-label");
  if (label) label.textContent = name === "wasteland" ? "WASTELAND · SECTOR 01" : name.toUpperCase();
});
events.on("debug:frame", (stats) => {
  document.querySelector("#fps-value").textContent = String(stats.fps);
  document.querySelector("#delta-value").textContent = `${(stats.delta * 1000).toFixed(1)} ms`;
  document.querySelector("#canvas-value").textContent = `${renderer.width} × ${renderer.height}`;
  document.querySelector("#resolution-label").textContent = `${renderer.width} × ${renderer.height}`;
});

renderer.resize();
scenes.register("test", new TestScene({ name: "Prueba de renderizado", variant: 0 }));
scenes.register("wasteland", new WastelandScene());
scenes.register("layers", new TestScene({ name: "Prueba de capas", variant: 1 }));
scenes.switchTo("wasteland");

pauseButton.addEventListener("click", () => {
  const paused = engine.togglePause();
  pauseButton.textContent = paused ? "Reanudar" : "Pausar";
});
sceneButton.addEventListener("click", () => {
  scenes.switchTo(scenes.currentName === "wasteland" ? "test" : "wasteland");
});
debugButton.addEventListener("click", () => {
  const visible = debug.toggle();
  debugButton.textContent = `Depuración: ${visible ? "ON" : "OFF"}`;
  debugButton.setAttribute("aria-pressed", String(visible));
});

async function toggleFullscreen() {
  const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  if (!active) {
    try {
      const target = appShell || document.documentElement;
      if (target.requestFullscreen) await target.requestFullscreen({ navigationUI: "hide" });
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
      else { appShell?.classList.add("is-fullscreen"); }
      try { await screen.orientation?.lock?.("landscape"); } catch (_) {}
    } catch (error) {
      appShell?.classList.add("is-fullscreen");
      console.warn("Pantalla completa del navegador no disponible; se activó el modo expandido.", error);
    }
  } else {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (_) {}
    appShell?.classList.remove("is-fullscreen");
    try { screen.orientation?.unlock?.(); } catch (_) {}
  }
  updateFullscreenButton();
  setTimeout(() => renderer.resize(), 120);
}
function updateFullscreenButton() {
  const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement || appShell?.classList.contains("is-fullscreen"));
  if (fullscreenButton) {
    fullscreenButton.textContent = active ? "⛶ SALIR" : "⛶ PANTALLA COMPLETA";
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.setAttribute("aria-label", active ? "Salir de pantalla completa" : "Activar pantalla completa");
  }
}
fullscreenButton?.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", () => { updateFullscreenButton(); setTimeout(() => renderer.resize(), 120); });
document.addEventListener("webkitfullscreenchange", () => { updateFullscreenButton(); setTimeout(() => renderer.resize(), 120); });
window.addEventListener("resize", () => renderer.resize());
window.addEventListener("orientationchange", () => setTimeout(() => renderer.resize(), 150));
engine.start();
