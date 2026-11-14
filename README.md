# Wasteland Engine 2D — Fase 1

Núcleo funcional inicial de un motor 2D modular con HTML, CSS y JavaScript ES Modules.

## Incluye
- Game Loop con delta time limitado.
- Renderizador Canvas 2D adaptable a pantallas y densidad de píxeles.
- Gestor de escenas con registro y cambio de escena.
- Gestor básico de recursos gráficos.
- Entrada de teclado, puntero y pantalla táctil.
- Event Bus para comunicación desacoplada.
- Depuración con FPS, delta y resolución.
- Escena de prueba interactiva.
- Controles de pausa, cambio de escena y depuración.

## Ejecutar
Los módulos ES deben servirse mediante HTTP/HTTPS; abrir index.html directamente como file:// puede ser bloqueado por el navegador.
Publica esta carpeta en un hosting estático HTTPS, o ejecuta en PC: python -m http.server 8000 y abre http://localhost:8000.

## Controles
- PC: WASD o flechas para mover el marcador.
- Android: tocar o arrastrar dentro del escenario.
- Pausar, cambiar escena y activar/desactivar depuración mediante los botones.

## Alcance
Esta es la Fase 1. No incluye todavía jugador definitivo, física avanzada, colisiones de mundo, editor de mapas, chunks, inventario, combate, guardado ni multijugador.

## Criterios de aceptación
- [x] Inicialización, Game Loop y Canvas 2D.
- [x] Gestor de escenas y recursos.
- [x] Entrada de teclado y táctil.
- [x] Event Bus y estadísticas de depuración.
- [x] Canvas adaptable y escena interactiva.

El renderizador está aislado detrás de CanvasRenderer para permitir incorporar WebGL más adelante sin acoplar el resto del motor a Canvas.
