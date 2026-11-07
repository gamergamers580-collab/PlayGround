import * as THREE from 'three';
import './styles.css';

const root = document.querySelector('#game-root');
const objectiveEl = document.querySelector('#objective');
const timerEl = document.querySelector('#timer');
const messagePanel = document.querySelector('#message-panel');
const startScreen = document.querySelector('#start-screen');
const endScreen = document.querySelector('#end-screen');
const resultLabel = document.querySelector('#result-label');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');

const WORLD_HALF = 16;
const PLAYER_RADIUS = 0.7;
const EXIT_POSITION = new THREE.Vector3(13.5, 0.6, -12.5);

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const state = {
  running: false,
  won: false,
  lost: false,
  startTime: 0,
  elapsed: 0,
  eggCollected: false,
  messageTimeout: 0,
};

const world = {
  width: WORLD_HALF * 2,
  height: WORLD_HALF * 2,
  walls: [
    { x: 0, z: -15.5, w: 32, h: 1.2 },
    { x: 0, z: 15.5, w: 32, h: 1.2 },
    { x: -15.5, z: 0, w: 1.2, h: 32 },
    { x: 15.5, z: 0, w: 1.2, h: 32 },

    { x: -6, z: -7.5, w: 7.5, h: 1.2 },
    { x: 6, z: -9, w: 1.2, h: 9 },
    { x: 0, z: 1, w: 7.5, h: 1.2 },
    { x: -8, z: 7.5, w: 9, h: 1.2 },
    { x: 9, z: 8.5, w: 1.2, h: 8 },
    { x: -1.5, z: -12.5, w: 1.2, h: 5.5 },
    { x: 8, z: -3.5, w: 7, h: 1.2 },
    { x: 4, z: 12, w: 8, h: 1.2 },
    { x: -11, z: 11, w: 1.2, h: 7 },
    { x: 12, z: -12, w: 7, h: 1.2 },
  ],
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x081822);
scene.fog = new THREE.Fog(0x081822, 15, 46);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
camera.position.set(0, 16, 19);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const ambient = new THREE.HemisphereLight(0xbfe0ff, 0x0d1a26, 1.2);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff3cf, 1.4);
sun.position.set(8, 18, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
scene.add(sun);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x15364d, roughness: 0.88, metalness: 0.15 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const floorGlow = new THREE.Mesh(
  new THREE.RingGeometry(7.5, 10.5, 64),
  new THREE.MeshBasicMaterial({ color: 0x4cc9ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
);
floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.set(0, 0.02, 0);
scene.add(floorGlow);

const exitPad = new THREE.Mesh(
  new THREE.CylinderGeometry(1.8, 1.8, 0.38, 32),
  new THREE.MeshStandardMaterial({ color: 0x1b2b40, emissive: 0x173a5b, emissiveIntensity: 0.5 })
);
exitPad.position.copy(EXIT_POSITION);
exitPad.position.y = 0.18;
exitPad.receiveShadow = true;
scene.add(exitPad);

const exitRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.1, 0.18, 16, 64),
  new THREE.MeshStandardMaterial({ color: 0xffde7d, emissive: 0xffc22e, emissiveIntensity: 0.8 })
);
exitRing.rotation.x = Math.PI / 2;
exitRing.position.copy(EXIT_POSITION);
exitRing.position.y = 0.8;
scene.add(exitRing);

const player = {
  position: new THREE.Vector3(-12.5, 0.7, 12.5),
  velocity: new THREE.Vector3(),
  radius: PLAYER_RADIUS,
  speed: 5.6,
  mesh: null,
};

function makePlayerMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.52, 1.2, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x9bd3ff, emissive: 0x1a69a3, emissiveIntensity: 0.18 })
  );
  body.castShadow = true;
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.8;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xf4d39c, emissive: 0x714d39, emissiveIntensity: 0.08 })
  );
  head.position.y = 1.7;
  head.castShadow = true;
  group.add(head);

  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.4, 0.28, 16),
    new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0x782828, emissiveIntensity: 0.2 })
  );
  hat.position.y = 2.05;
  group.add(hat);

  group.position.copy(player.position);
  scene.add(group);
  return group;
}

player.mesh = makePlayerMesh();

const guards = [];
const guardData = [
  { name: 'A', color: 0xff6464, start: [-11, -11], path: [[-11, -11], [8, -11], [8, 2], [-4, 2], [-4, -11]] },
  { name: 'B', color: 0x6bc3ff, start: [11, 8], path: [[11, 8], [11, -6], [0, -6], [0, 8], [11, 8]] },
  { name: 'C', color: 0xffd166, start: [-9, 11], path: [[-9, 11], [7, 11], [7, 6], [-9, 6], [-9, 11]] },
];

function addWallVisual(wall) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(wall.w, 2.4, wall.h),
    new THREE.MeshStandardMaterial({ color: 0x2e4967, roughness: 0.8, metalness: 0.15 })
  );
  mesh.position.set(wall.x, 1.2, wall.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

for (const wall of world.walls) {
  addWallVisual(wall);
}

function createGuard(config) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 1.5, 16),
    new THREE.MeshStandardMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.2 })
  );
  body.position.y = 0.8;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf7e6d2, emissive: 0x5a4032, emissiveIntensity: 0.08 })
  );
  head.position.y = 1.8;
  group.add(head);

  group.position.set(config.start[0], 0, config.start[1]);
  group.rotation.y = Math.PI;
  scene.add(group);

  const guard = {
    config,
    mesh: group,
    pos: new THREE.Vector3(config.start[0], 0, config.start[1]),
    targetIndex: 0,
    speed: 2.1,
    visionRange: 7.8,
    visionHalfAngle: Math.PI / 3.8,
    seenPlayer: false,
    timeSinceSeen: 0,
  };

  guards.push(guard);
}

for (const config of guardData) {
  createGuard(config);
}

const egg = {
  mesh: new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.8, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf5d76d,
      emissive: 0xaa7d1d,
      emissiveIntensity: 0.55,
      metalness: 0.45,
      roughness: 0.38,
    })
  ),
  position: new THREE.Vector3(-2.5, 1.2, -2.5),
};

egg.mesh.position.copy(egg.position);
egg.mesh.castShadow = true;
scene.add(egg.mesh);

const crystals = [];
const crystalPositions = [
  [-12.5, -11.5],
  [12.5, 11.5],
  [12.5, -11.5],
  [-12.5, 12.5],
];

for (const [x, z] of crystalPositions) {
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({ color: 0x8ff7d4, emissive: 0x29d0a8, emissiveIntensity: 0.75 })
  );
  crystal.position.set(x, 1.2, z);
  crystal.castShadow = true;
  scene.add(crystal);
  crystals.push({ mesh: crystal, collected: false, pos: new THREE.Vector3(x, 1.2, z) });
}

function showMessage(text, duration = 1.6) {
  messagePanel.textContent = text;
  messagePanel.classList.remove('hidden');
  state.messageTimeout = duration;
}

function hideMessage() {
  messagePanel.classList.add('hidden');
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const secs = String(total % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

function updateHud() {
  objectiveEl.textContent = state.eggCollected
    ? 'Escape with the egg'
    : 'Steal the golden egg';
  timerEl.textContent = formatTime(state.elapsed);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wallHitTest(x, z, radius) {
  for (const wall of world.walls) {
    const closestX = clamp(x, wall.x - wall.w / 2 - radius, wall.x + wall.w / 2 + radius);
    const closestZ = clamp(z, wall.z - wall.h / 2 - radius, wall.z + wall.h / 2 + radius);
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < radius * radius) {
      return true;
    }
  }
  return false;
}

function moveWithCollisions(entity, dx, dz) {
  const nextX = entity.position.x + dx;
  if (!wallHitTest(nextX, entity.position.z, entity.radius)) {
    entity.position.x = clamp(nextX, -WORLD_HALF + entity.radius, WORLD_HALF - entity.radius);
  }

  const nextZ = entity.position.z + dz;
  if (!wallHitTest(entity.position.x, nextZ, entity.radius)) {
    entity.position.z = clamp(nextZ, -WORLD_HALF + entity.radius, WORLD_HALF - entity.radius);
  }
}

function pickUpCrystals() {
  for (const crystal of crystals) {
    if (!crystal.collected) {
      const dx = player.position.x - crystal.pos.x;
      const dz = player.position.z - crystal.pos.z;
      if (Math.hypot(dx, dz) < 1.3) {
        crystal.collected = true;
        crystal.mesh.visible = false;
        player.speed = 6.6;
        showMessage('Speed boost!');
      }
    }
  }
}

function pickupEgg() {
  if (!state.eggCollected) {
    const d = player.position.distanceTo(egg.position);
    if (d < 1.4) {
      state.eggCollected = true;
      egg.mesh.visible = false;
      showMessage('Egg secured! Escape to the exit door.');
      exitRing.material.emissiveIntensity = 1.4;
    }
  }
}

function checkWinLose() {
  if (state.won || state.lost) return;

  if (state.eggCollected) {
    const dist = player.position.distanceTo(EXIT_POSITION);
    if (dist < 2.0) {
      state.won = true;
      endScreen.classList.remove('hidden');
      resultLabel.textContent = 'Heist complete';
      resultTitle.textContent = 'You escaped!';
      resultMessage.textContent = `The egg is yours. Time: ${formatTime(state.elapsed)}.`;
      showMessage('Mission complete!');
    }
  }

  const playerPos = player.position;
  for (const guard of guards) {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, guard.pos);
    const dist = toPlayer.length();
    const toGuardDir = guard.mesh.getWorldDirection(new THREE.Vector3()).setY(0);
    const facing = new THREE.Vector3().copy(toPlayer).setY(0).normalize();

    if (dist < guard.visionRange) {
      const angle = facing.angleTo(toGuardDir);
      const wallBlocked = segmentHitsWall(guard.pos, playerPos, world.walls);
      if (angle < guard.visionHalfAngle && !wallBlocked) {
        state.lost = true;
        endScreen.classList.remove('hidden');
        resultLabel.textContent = 'Caught';
        resultTitle.textContent = 'The guards spotted you';
        resultMessage.textContent = 'Try a quieter route and keep out of their line of sight.';
        showMessage('Detected!');
        return;
      }
    }
  }
}

function segmentsIntersect(a, b, c, d) {
  const orient = (p, q, r) => {
    const val = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    return Math.abs(val) < 1e-8 ? 0 : val > 0 ? 1 : 2;
  };

  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && pointOnSegment(a, c, b)) return true;
  if (o2 === 0 && pointOnSegment(a, d, b)) return true;
  if (o3 === 0 && pointOnSegment(c, a, d)) return true;
  if (o4 === 0 && pointOnSegment(c, b, d)) return true;

  return false;
}

function pointOnSegment(a, p, b) {
  const minX = Math.min(a.x, b.x) - 1e-4;
  const maxX = Math.max(a.x, b.x) + 1e-4;
  const minY = Math.min(a.y, b.y) - 1e-4;
  const maxY = Math.max(a.y, b.y) + 1e-4;
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

function segmentHitsWall(start, end, walls) {
  const a = new THREE.Vector2(start.x, start.z);
  const b = new THREE.Vector2(end.x, end.z);

  for (const wall of walls) {
    const rect = [
      new THREE.Vector2(wall.x - wall.w / 2, wall.z - wall.h / 2),
      new THREE.Vector2(wall.x + wall.w / 2, wall.z - wall.h / 2),
      new THREE.Vector2(wall.x + wall.w / 2, wall.z + wall.h / 2),
      new THREE.Vector2(wall.x - wall.w / 2, wall.z + wall.h / 2),
    ];

    for (let i = 0; i < rect.length; i++) {
      const p1 = rect[i];
      const p2 = rect[(i + 1) % rect.length];
      if (segmentsIntersect(a, b, p1, p2)) {
        return true;
      }
    }
  }

  return false;
}

function updateGuards(delta) {
  for (const guard of guards) {
    const current = guard.config.path[guard.targetIndex];
    const target = new THREE.Vector3(current[0], 0, current[1]);
    const vec = new THREE.Vector3().subVectors(target, guard.pos);
    const distance = vec.length();

    if (distance < 0.2) {
      guard.targetIndex = (guard.targetIndex + 1) % guard.config.path.length;
      continue;
    }

    const direction = vec.normalize();
    guard.pos.addScaledVector(direction, guard.speed * delta);
    guard.mesh.position.set(guard.pos.x, 0, guard.pos.z);
    guard.mesh.lookAt(guard.pos.x + direction.x, 0, guard.pos.z + direction.z);
  }
}

function updatePlayer(delta) {
  const movement = new THREE.Vector3(
    (input.right ? 1 : 0) - (input.left ? 1 : 0),
    0,
    (input.down ? 1 : 0) - (input.up ? 1 : 0)
  );

  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(player.speed * delta);
    moveWithCollisions(player, movement.x, movement.z);
  }

  player.mesh.position.set(player.position.x, 0, player.position.z);
  player.mesh.rotation.y = Math.atan2(movement.x, movement.z);
}

function updateCamera() {
  const desired = new THREE.Vector3(player.position.x * 0.28, 13, 18.2);
  camera.position.lerp(desired, 0.08);
  camera.lookAt(player.position.x, 0, player.position.z);
}

function updateCrystalWobble(time) {
  for (const crystal of crystals) {
    crystal.mesh.position.y = crystal.pos.y + Math.sin(time * 2.6 + crystal.pos.x) * 0.25;
    crystal.mesh.rotation.y += 0.04;
  }

  egg.mesh.rotation.y += 0.04;
  egg.mesh.position.y = 1.1 + Math.sin(time * 3.1) * 0.25;
  exitRing.rotation.z += 0.02;
}

function setRunning(value) {
  state.running = value;
  if (value) {
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    messagePanel.classList.add('hidden');
    player.position.set(-12.5, 0.7, 12.5);
    player.speed = 5.6;
    for (const crystal of crystals) {
      crystal.collected = false;
      crystal.mesh.visible = true;
    }
    state.eggCollected = false;
    state.won = false;
    state.lost = false;
    egg.mesh.visible = true;
    exitRing.material.emissiveIntensity = 0.8;
    state.startTime = performance.now();
    state.elapsed = 0;
    updateHud();
  }
}

function handleKeyboard(event, pressed) {
  const key = event.key.toLowerCase();
  if (key === 'w' || key === 'arrowup') input.up = pressed;
  if (key === 's' || key === 'arrowdown') input.down = pressed;
  if (key === 'a' || key === 'arrowleft') input.left = pressed;
  if (key === 'd' || key === 'arrowright') input.right = pressed;

  if (!state.running && pressed && (key === 'enter' || key === ' ')) {
    setRunning(true);
  }
}

window.addEventListener('keydown', (event) => handleKeyboard(event, true));
window.addEventListener('keyup', (event) => handleKeyboard(event, false));

startButton.addEventListener('click', () => setRunning(true));
restartButton.addEventListener('click', () => setRunning(true));

const touchButtons = document.querySelectorAll('[data-move]');
touchButtons.forEach((button) => {
  const name = button.dataset.move;
  const setValue = (pressed) => {
    if (name === 'up') input.up = pressed;
    if (name === 'down') input.down = pressed;
    if (name === 'left') input.left = pressed;
    if (name === 'right') input.right = pressed;
  };

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    setValue(true);
  });
  button.addEventListener('pointerup', () => setValue(false));
  button.addEventListener('pointerleave', () => setValue(false));
  button.addEventListener('pointercancel', () => setValue(false));
});

function resize() {
  const width = root.clientWidth;
  const height = root.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener('resize', resize);
resize();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  if (state.running && !state.won && !state.lost) {
    state.elapsed = (performance.now() - state.startTime) / 1000;
    updateHud();
    updatePlayer(delta);
    updateGuards(delta);
    pickUpCrystals();
    pickupEgg();
    checkWinLose();
  }

  updateCrystalWobble(elapsed);
  updateCamera();
  if (state.messageTimeout > 0) {
    state.messageTimeout -= delta;
    if (state.messageTimeout <= 0) hideMessage();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

updateHud();
animate();
