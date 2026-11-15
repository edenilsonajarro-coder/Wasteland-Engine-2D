export class InputManager {
  constructor(target, joystick, knob) {
    this.target = target;
    this.joystick = joystick;
    this.knob = knob;
    this.keys = new Set();
    this.axis = { x: 0, y: 0 };
    this.actions = new Set();
    this.bindActionButton("attack-control", "attack");
    this.bindActionButton("interact-control", "interact");
    this.pointerId = null;
    this.boundKeyDown = (event) => {
      this.keys.add(event.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    };
    this.boundKeyUp = (event) => this.keys.delete(event.code);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
    this.joystick.addEventListener("pointerdown", this.onJoystickDown.bind(this));
    this.joystick.addEventListener("pointermove", this.onJoystickMove.bind(this));
    this.joystick.addEventListener("pointerup", this.onJoystickUp.bind(this));
    this.joystick.addEventListener("pointercancel", this.onJoystickUp.bind(this));
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.actions.clear();
      this.resetJoystick();
    });
  }

  bindActionButton(id, action) {
    const button = document.getElementById(id);
    if (!button) return;
    const down = (event) => { event.preventDefault(); this.actions.add(action); };
    const up = (event) => { event.preventDefault(); this.actions.delete(action); };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("lostpointercapture", up);
  }

  isActionDown(action) { return this.actions.has(action); }

  // Kept as a per-frame hook so GameEngine can update all input devices uniformly.
  update() {}

  onJoystickDown(event) {
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.joystick.setPointerCapture(event.pointerId);
    this.updateJoystick(event);
  }

  onJoystickMove(event) {
    if (event.pointerId !== this.pointerId) return;
    this.updateJoystick(event);
  }

  onJoystickUp(event) {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.resetJoystick();
  }

  updateJoystick(event) {
    const rect = this.joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.34;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > maxRadius) {
      dx = dx / distance * maxRadius;
      dy = dy / distance * maxRadius;
    }
    this.axis.x = dx / maxRadius;
    this.axis.y = dy / maxRadius;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  resetJoystick() {
    this.axis.x = 0;
    this.axis.y = 0;
    this.knob.style.transform = "translate(0, 0)";
  }

  isDown(...codes) { return codes.some(code => this.keys.has(code)); }

  get movement() {
    let x = Number(this.isDown("ArrowRight", "KeyD")) - Number(this.isDown("ArrowLeft", "KeyA")) + this.axis.x;
    let y = Number(this.isDown("ArrowDown", "KeyS")) - Number(this.isDown("ArrowUp", "KeyW")) + this.axis.y;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    return { x, y };
  }
}
