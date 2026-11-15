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
window.addEventListener("resize", () => renderer.resize());
window.addEventListener("orientationchange", () => setTimeout(() => renderer.resize(), 150));
engine.start();
