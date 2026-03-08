import { clamp, computeBrickRows, progressPercentage } from "./logic.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const state = {
  lives: 3,
  score: 0,
  combo: 0,
  tempo: 120,
  uber: 60,
  status: "Valmiina",
  running: false,
  mode: "classic",
  speedFactor: 1,
  modeTempoBoost: 0,
  highScore: 0,
  scoreMultiplier: 1,
  level: 1,
  currentRows: 0,
  totalBricks: 0,
  beatPulse: 0,
};

const HIGHSCORE_KEY = "uberarkanoid-highscore";

const BASE_PADDLE_WIDTH = 180;
const paddle = {
  width: BASE_PADDLE_WIDTH,
  height: 14,
  x: 0,
  y: 0,
  speed: 520,
};

const ball = {
  radius: 10,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
};

const input = {
  left: false,
  right: false,
};

const dom = {
  lives: document.getElementById("livesValue"),
  score: document.getElementById("scoreValue"),
  combo: document.getElementById("comboValue"),
  tempo: document.getElementById("tempoValue"),
  status: document.getElementById("statusText"),
  uberFill: document.getElementById("uberFill"),
  highScore: document.getElementById("highScoreValue"),
  levelProgress: document.getElementById("levelProgress"),
  levelValue: document.getElementById("levelValue"),
  musicSelect: document.getElementById("musicSelect"),
  musicToggle: document.getElementById("musicToggle"),
  musicNote: document.getElementById("musicNote"),
};

const modeControl = document.getElementById("modeSelect");

state.highScore = readHighScore();
persistHighScore(state.highScore);

const computedStyles = getComputedStyle(document.documentElement);
const palette = {
  grid: "rgba(255, 255, 255, 0.04)",
  card: computedStyles.getPropertyValue("--card-2").trim() || "#2a1f48",
};

const MODE_SETTINGS = {
  classic: { label: "Classic", speed: 1, tempoBoost: 0 },
  beat: { label: "Beat Mode", speed: 1.08, tempoBoost: 18 },
  ultra: { label: "Ultra", speed: 1.25, tempoBoost: 35 },
};

const UBER_THRESHOLD = 100;
const UBER_DURATION = 4200;
const UBER_WIDTH_BONUS = 80;
const UBER_DECAY = 4;

const BRICK_BASE_ROWS = 5;
const BRICK_MAX_EXTRA_ROWS = 3;
const BRICK_COLS = 11;
const BRICK_HEIGHT = 24;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_SIDE = 34;
const BRICK_COLORS = ["#ff4fd8", "#30d9ff", "#62ff8a", "#ffd93d", "#ff6b7f"];

const POWERUP_DROP_CHANCE = 0.2;
const POWERUP_SPEED = 110;
const POWERUP_RADIUS = 12;
const POWERUP_DURATION = 5200;
const POWERUP_COLOR = "rgba(255, 225, 79, 0.9)";
let powerupExpires = 0;

const SLOW_MULTIPLIER = 0.6;
const SLOW_DURATION = 5200;
let slowActive = false;
let slowExpires = 0;

const MUSIC_CONFIG_PATH = "config/music.json";
const LEVELS_CONFIG_PATH = "levels/levels.json";

const DEFAULT_TRACKS = [
  { id: "tekno-pulse", name: "Tekno Pulse", style: "tekno", bpm: 142 },
  { id: "gabber-core", name: "Gabber Core", style: "gabber", bpm: 175 },
  { id: "acid-tekno", name: "Acid Tekno", style: "tekno", bpm: 150 },
  { id: "turbo-rush", name: "Turbo Rush", style: "gabber", bpm: 168 },
];

let TRACKS = [...DEFAULT_TRACKS];

const DEFAULT_LEVEL_PATTERNS = [
  {
    id: 1,
    pattern: [
      "11111111111",
      "10111111011",
      "11100111111",
      "10111111011",
      "11111111111",
    ],
  },
  {
    id: 2,
    pattern: [
      "11111011111",
      "01111111110",
      "11111111111",
      "01111111110",
      "11111011111",
      "10111111011",
    ],
  },
  {
    id: 3,
    pattern: [
      "10101010101",
      "01010101010",
      "11111111111",
      "00010000100",
      "11111111111",
      "01010101010",
    ],
  },
];

let LEVEL_PATTERNS = [...DEFAULT_LEVEL_PATTERNS];

const POWERUP_POOL = ["score", "score", "slow", "multi", "laser"];

let bricks = [];
let uberActive = false;
let uberExpires = 0;
let powerUps = [];
let extraBalls = [];
let laserShots = [];
let laserActive = false;
let laserExpires = 0;
let lastLaserShot = 0;

const MULTI_BALL_COUNT = 2;
const EXTRA_BALL_RADIUS = 8;
const EXTRA_BALL_SPEED = 240;

const LASER_SPEED = 420;
const LASER_DURATION = 6400;
const LASER_FIRE_INTERVAL = 520;
const LASER_COLOR = "rgba(255, 79, 216, 0.95)";
const LASER_WIDTH = 6;

const BEAT_DECAY = 3;

function readHighScore() {
  try {
    const saved = Number(localStorage.getItem(HIGHSCORE_KEY));
    return Number.isFinite(saved) ? saved : 0;
  } catch {
    return 0;
  }
}

function persistHighScore(value) {
  if (dom.highScore) {
    dom.highScore.textContent = String(value).padStart(4, "0");
  }
  try {
    localStorage.setItem(HIGHSCORE_KEY, String(value));
  } catch {
    // ignore
  }
}

function configureCanvas() {
  canvas.width = 960;
  canvas.height = 540;
  paddle.width = BASE_PADDLE_WIDTH;
  paddle.x = canvas.width / 2 - paddle.width / 2;
  paddle.y = canvas.height - 40;
  state.combo = 0;
  state.uber = 60;
  uberActive = false;
  uberExpires = 0;
  state.scoreMultiplier = 1;
  powerupExpires = 0;
  powerUps = [];
  extraBalls = [];
  laserShots = [];
  stopLaser();
  slowActive = false;
  slowExpires = 0;
  buildBricks();
  resetBall(false);
}

function resetBall(acceptLaunch) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  const factor = state.speedFactor || 1;
  ball.vx = (Math.random() > 0.5 ? 1 : -1) * 220 * factor;
  ball.vy = -320 * factor;
  state.running = acceptLaunch;
  state.status = acceptLaunch ? "Pelaa!" : "Paina välilyöntiä aloittaaksesi";
  extraBalls = [];
  laserShots = [];
  stopLaser();
}

function getPatternForLevel(level) {
  if (!LEVEL_PATTERNS.length) {
    return null;
  }
  return LEVEL_PATTERNS[(level - 1) % LEVEL_PATTERNS.length];
}

function getRowMask(pattern, rowIndex) {
  if (!pattern || !pattern.pattern?.length) {
    return "1".repeat(BRICK_COLS);
  }
  const rows = pattern.pattern;
  const baseRow = rows[rowIndex % rows.length] || rows[rows.length - 1];
  const padChar = baseRow[baseRow.length - 1] || "1";
  return (baseRow + padChar.repeat(BRICK_COLS)).slice(0, BRICK_COLS);
}

function buildBricks(level = state.level) {
  const pattern = getPatternForLevel(level);
  const computedRows = computeBrickRows(level, BRICK_BASE_ROWS, BRICK_MAX_EXTRA_ROWS);
  const patternRows = pattern?.pattern?.length || computedRows;
  const totalRows = Math.max(computedRows, patternRows);
  state.currentRows = totalRows;
  bricks = [];
  state.totalBricks = 0;
  const totalPadding = BRICK_PADDING * (BRICK_COLS - 1);
  const width = (canvas.width - BRICK_OFFSET_SIDE * 2 - totalPadding) / BRICK_COLS;
  for (let row = 0; row < totalRows; row += 1) {
    const mask = getRowMask(pattern, row);
    for (let col = 0; col < BRICK_COLS; col += 1) {
      if (mask[col] === "0") {
        continue;
      }
      const x = BRICK_OFFSET_SIDE + col * (width + BRICK_PADDING);
      const y = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING);
      bricks.push({
        x,
        y,
        width,
        height: BRICK_HEIGHT,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
        alive: true,
      });
      state.totalBricks += 1;
    }
  }
}

function createExtraBall() {
  const speed = state.speedFactor || 1;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    radius: EXTRA_BALL_RADIUS,
    x: paddle.x + paddle.width / 2,
    y: paddle.y - EXTRA_BALL_RADIUS - 6,
    vx: direction * EXTRA_BALL_SPEED * speed,
    vy: -EXTRA_BALL_SPEED * speed,
    active: true,
  };
}

function updateExtraBalls(dt, timestampMs, motionFactor) {
  for (const extraBall of extraBalls) {
    extraBall.x += extraBall.vx * dt * motionFactor;
    extraBall.y += extraBall.vy * dt * motionFactor;
    if (extraBall.x - extraBall.radius <= 0 || extraBall.x + extraBall.radius >= canvas.width) {
      extraBall.vx *= -1;
    }
    if (extraBall.y - extraBall.radius <= 0) {
      extraBall.vy *= -1;
    }
    handleBrickCollisions(extraBall, timestampMs);
    handlePaddleCollision(extraBall);
    if (extraBall.y - extraBall.radius > canvas.height) {
      extraBall.active = false;
    }
  }
  extraBalls = extraBalls.filter((extraBall) => extraBall.active);
}

function drawBall(currentBall = ball) {
  const gradient = ctx.createRadialGradient(
    currentBall.x,
    currentBall.y,
    0,
    currentBall.x,
    currentBall.y,
    currentBall.radius * 1.8
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, currentBall.radius > ball.radius ? "rgba(255, 99, 180, 0.8)" : "rgba(99, 255, 186, 0.7)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(currentBall.x, currentBall.y, currentBall.radius, 0, Math.PI * 2);
  ctx.fill();
}

function spawnLaserShot() {
  laserShots.push({
    x: paddle.x + paddle.width / 2,
    y: paddle.y,
    vy: -LASER_SPEED,
    alive: true,
  });
}

function updateLaserShots(dt) {
  if (!laserShots.length) {
    return;
  }
  for (const shot of laserShots) {
    shot.y += shot.vy * dt;
    handleLaserCollisions(shot);
    if (shot.y + LASER_WIDTH < 0) {
      shot.alive = false;
    }
  }
  laserShots = laserShots.filter((shot) => shot.alive);
  if (state.running && bricks.every((brick) => !brick.alive)) {
    advanceLevel();
    laserShots = [];
  }
}

function drawLaserShots() {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = LASER_COLOR;
  ctx.shadowColor = LASER_COLOR;
  ctx.shadowBlur = 18;
  for (const shot of laserShots) {
    ctx.lineWidth = LASER_WIDTH;
    ctx.beginPath();
    ctx.moveTo(shot.x, shot.y);
    ctx.lineTo(shot.x, shot.y - 32);
    ctx.stroke();
  }
  ctx.restore();
}

function handleLaserCollisions(shot) {
  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }
    if (
      shot.y <= brick.y + brick.height &&
      shot.y >= brick.y &&
      shot.x >= brick.x &&
      shot.x <= brick.x + brick.width
    ) {
      brick.alive = false;
      shot.alive = false;
      state.uber = Math.min(state.uber + 8, 100);
      updateScore(120);
      maybeSpawnPowerUp(brick);
      break;
    }
  }
}

function choosePowerUpType() {
  const index = Math.floor(Math.random() * POWERUP_POOL.length);
  return POWERUP_POOL[index];
}

function updatePowerUps(dt, timestampMs) {
  for (const powerUp of powerUps) {
    powerUp.y += powerUp.vy * dt;
    if (powerUp.y > canvas.height + POWERUP_RADIUS) {
      powerUp.alive = false;
      continue;
    }
    if (
      powerUp.y + POWERUP_RADIUS >= paddle.y &&
      powerUp.x >= paddle.x &&
      powerUp.x <= paddle.x + paddle.width
    ) {
      activatePowerUp(powerUp.type, timestampMs);
      powerUp.alive = false;
    }
  }
  powerUps = powerUps.filter((powerUp) => powerUp.alive);
}

function drawPowerUps() {
  for (const powerUp of powerUps) {
    ctx.fillStyle = POWERUP_COLOR;
    ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, POWERUP_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function maybeSpawnPowerUp(brick) {
  if (Math.random() >= POWERUP_DROP_CHANCE) {
    return;
  }
  powerUps.push({
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height + 4,
    vy: POWERUP_SPEED,
    type: choosePowerUpType(),
    alive: true,
  });
}

function updateScore(amount) {
  const delta = amount * state.scoreMultiplier;
  state.score += delta;
  dom.score.textContent = String(Math.floor(state.score)).padStart(4, "0");
  if (state.score > state.highScore) {
    state.highScore = state.score;
    persistHighScore(state.highScore);
  }
}

function handleBrickCollisions(currentBall, timestampMs) {
  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }
    const hitsX =
      currentBall.x + currentBall.radius > brick.x &&
      currentBall.x - currentBall.radius < brick.x + brick.width;
    const hitsY =
      currentBall.y + currentBall.radius > brick.y &&
      currentBall.y - currentBall.radius < brick.y + brick.height;
    if (hitsX && hitsY) {
      brick.alive = false;
      currentBall.vy *= -1;
      updateScore(70);
      state.status = "Tiili tuhottu";
      state.uber = Math.min(state.uber + 8, 100);
      if (state.uber >= UBER_THRESHOLD && !uberActive) {
        activateUber(timestampMs);
      }
      maybeSpawnPowerUp(brick);
      break;
    }
  }
}

function handlePaddleCollision(currentBall) {
  if (
    currentBall.y + currentBall.radius >= paddle.y &&
    currentBall.x >= paddle.x &&
    currentBall.x <= paddle.x + paddle.width &&
    currentBall.vy > 0
  ) {
    currentBall.y = paddle.y - currentBall.radius;
    currentBall.vy *= -1;
    state.combo += 1;
    const tempoBase = 120 + (state.modeTempoBoost || 0);
    state.tempo = tempoBase + Math.min(state.combo * 2, 40);
    state.uber = Math.min(state.uber + 5, 100);
    if (currentBall === ball) {
      state.status = "Pelaa!";
    }
  }
}

function activatePowerUp(type, timestampMs) {
  powerupExpires = timestampMs + POWERUP_DURATION;
  if (type === "score") {
    state.scoreMultiplier = 2;
    state.status = "Score boost!";
    return;
  }
  if (type === "slow") {
    slowActive = true;
    slowExpires = timestampMs + SLOW_DURATION;
    state.status = "Slow motion!";
    return;
  }
  if (type === "multi") {
    const spawnCount = Math.min(extraBalls.length + MULTI_BALL_COUNT, 4);
    for (let i = 0; i < spawnCount; i += 1) {
      extraBalls.push(createExtraBall());
    }
    state.status = "Multi-pallot pelissä";
    return;
  }
  if (type === "laser") {
    laserActive = true;
    laserExpires = timestampMs + LASER_DURATION;
    lastLaserShot = timestampMs - LASER_FIRE_INTERVAL;
    spawnLaserShot();
    state.status = "Laser-isku!";
  }
}

function stopLaser() {
  laserActive = false;
  laserShots = [];
  laserExpires = 0;
  lastLaserShot = 0;
}

function activateUber(timestampMs) {
  uberActive = true;
  uberExpires = timestampMs + UBER_DURATION;
  paddle.width = BASE_PADDLE_WIDTH + UBER_WIDTH_BONUS;
  paddle.x = clamp(paddle.x - UBER_WIDTH_BONUS / 2, 0, canvas.width - paddle.width);
  state.status = "Uber-tila!";
  state.uber = 50;
}

function advanceLevel() {
  state.level += 1;
  const track = selectTrackForLevel(state.level);
  state.status = `Level ${state.level} aloitettu — ${track ? track.name : "uus"}`;
  state.uber = Math.min(state.uber + 20, 100);
  state.combo = 0;
  state.scoreMultiplier = 1;
  powerupExpires = 0;
  slowActive = false;
  slowExpires = 0;
  powerUps = [];
  extraBalls = [];
  stopLaser();
  buildBricks(state.level);
  resetBall(false);
  refreshMusicNote();
  if (musicEngine.isPlaying) {
    musicEngine.start(track);
  }
}

function update(dt, timestampMs) {
  if (input.left) {
    paddle.x -= paddle.speed * dt;
  }
  if (input.right) {
    paddle.x += paddle.speed * dt;
  }
  paddle.x = clamp(paddle.x, 0, canvas.width - paddle.width);

  if (uberActive && timestampMs >= uberExpires) {
    uberActive = false;
    paddle.width = BASE_PADDLE_WIDTH;
    paddle.x = clamp(paddle.x, 0, canvas.width - paddle.width);
    state.status = "Uber-tila valmis";
  }

  if (state.running) {
    state.uber = clamp(state.uber - dt * UBER_DECAY, 0, 100);
  }

  if (state.scoreMultiplier > 1 && timestampMs >= powerupExpires) {
    state.scoreMultiplier = 1;
    state.status = "Score boost ohi";
  }

  if (slowActive && timestampMs >= slowExpires) {
    slowActive = false;
    state.status = "Slow motion ohi";
  }

  if (state.beatPulse > 0) {
    state.beatPulse = Math.max(0, state.beatPulse - dt * BEAT_DECAY);
  }

  if (laserActive) {
    if (timestampMs >= laserExpires) {
      stopLaser();
      state.status = "Laser ohi";
    }
    if (timestampMs - lastLaserShot >= LASER_FIRE_INTERVAL) {
      spawnLaserShot();
      lastLaserShot = timestampMs;
    }
  }

  updateLaserShots(dt);

  if (!state.running) {
    return;
  }

  const motionFactor = slowActive ? SLOW_MULTIPLIER : 1;
  advanceBall(ball, dt, motionFactor, timestampMs, true);
  updateExtraBalls(dt, timestampMs, motionFactor);
  updatePowerUps(dt, timestampMs);
}

function advanceBall(currentBall, dt, motionFactor, timestampMs, isPrimary) {
  currentBall.x += currentBall.vx * dt * motionFactor;
  currentBall.y += currentBall.vy * dt * motionFactor;

  if (currentBall.x - currentBall.radius <= 0 || currentBall.x + currentBall.radius >= canvas.width) {
    currentBall.vx *= -1;
  }
  if (currentBall.y - currentBall.radius <= 0) {
    currentBall.vy *= -1;
    if (isPrimary) {
      updateScore(10);
    }
  }

  handleBrickCollisions(currentBall, timestampMs);
  handlePaddleCollision(currentBall);

  if (currentBall.y - currentBall.radius > canvas.height) {
    if (isPrimary) {
      state.lives -= 1;
      state.combo = 0;
      state.status =
        state.lives > 0 ? "Paina välilyöntiä jatkaaksesi" : "Peli ohi — lataa sivu uudelleen";
      state.running = false;
      resetBall(false);
    } else {
      currentBall.active = false;
    }
  }
}

function drawBackgroundGrid() {
  ctx.fillStyle = palette.card;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  const spacing = 48;
  for (let x = 0; x <= canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  if (state.beatPulse > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.06 * state.beatPulse})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPaddle() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.shadowColor = "rgba(0, 228, 255, 0.8)";
  ctx.shadowBlur = 20;
  drawRoundedRect(paddle.x, paddle.y, paddle.width, paddle.height, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBricks() {
  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }
    ctx.fillStyle = brick.color;
    ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
    ctx.shadowBlur = 14;
    drawRoundedRect(brick.x, brick.y, brick.width, brick.height, 8);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function draw() {
  drawBackgroundGrid();
  drawBricks();
  drawPowerUps();
  drawLaserShots();
  drawBall(ball);
  for (const extraBall of extraBalls) {
    drawBall(extraBall);
  }
  drawPaddle();
}

function refreshHud() {
  dom.lives.textContent = state.lives;
  dom.combo.textContent = `${state.combo}x`;
  dom.tempo.textContent = state.tempo;
  dom.status.textContent = state.status;
  dom.uberFill.style.width = `${state.uber}%`;
  if (dom.highScore) {
    dom.highScore.textContent = String(state.highScore).padStart(4, "0");
  }
  if (dom.levelProgress) {
    const alive = bricks.filter((brick) => brick.alive).length;
    const progress = progressPercentage(state.totalBricks, alive);
    dom.levelProgress.style.width = `${progress}%`;
  }
  if (dom.levelValue) {
    dom.levelValue.textContent = String(state.level);
  }
}

let lastTime = performance.now();

function loop(now) {
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  update(delta, now);
  draw(now / 1000);
  refreshHud();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    input.left = true;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    input.right = true;
  }
  if (event.code === "Space" && !state.running && state.lives > 0) {
    state.running = true;
    state.status = "Pelaa!";
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    input.left = false;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    input.right = false;
  }
});

canvas.addEventListener("click", () => {
  if (!state.running && state.lives > 0) {
    state.running = true;
    state.status = "Pelaa!";
  }
});

function populateMusicTracks() {
  if (!dom.musicSelect || !TRACKS.length) {
    return;
  }
  dom.musicSelect.innerHTML = TRACKS.map(
    (track) => `<option value="${track.id}">${track.name} (${track.bpm} bpm)</option>`
  ).join("");
  dom.musicSelect.value = TRACKS[0].id;
}

function getSelectedTrack() {
  const id = dom.musicSelect?.value;
  return TRACKS.find((track) => track.id === id) || TRACKS[0];
}

function formatStyle(style) {
  if (!style) {
    return "";
  }
  return style.charAt(0).toUpperCase() + style.slice(1);
}

function refreshMusicNote() {
  const track = getSelectedTrack();
  const styleLabel = formatStyle(track?.style);
  if (dom.musicNote) {
    dom.musicNote.textContent = `${track?.name || "Tekno"} — ${styleLabel} ${track?.bpm || 120} bpm`;
  }
  if (dom.musicToggle) {
    dom.musicToggle.textContent = musicEngine.isPlaying ? "Stop" : `Play ${styleLabel || "tekno"}`;
  }
}

function selectTrackForLevel(level) {
  if (!TRACKS.length) {
    return { id: "nokey", name: "Tekno" };
  }
  const index = (level - 1) % TRACKS.length;
  const track = TRACKS[index];
  if (dom.musicSelect) {
    dom.musicSelect.value = track.id;
  }
  return track;
}

function applyMode(mode) {
  const settings = MODE_SETTINGS[mode] || MODE_SETTINGS.classic;
  const previousSpeed = state.speedFactor || 1;
  state.mode = mode;
  state.speedFactor = settings.speed;
  state.modeTempoBoost = settings.tempoBoost;
  if (state.running) {
    const multiplier = settings.speed / Math.max(previousSpeed, 0.1);
    ball.vx *= multiplier;
    ball.vy *= multiplier;
    for (const extraBall of extraBalls) {
      extraBall.vx *= multiplier;
      extraBall.vy *= multiplier;
    }
  }
  if (!state.running) {
    state.status = `${settings.label} moodi`;
  }
  if (modeControl) {
    modeControl.value = mode;
  }
  const tempoBase = 120 + state.modeTempoBoost;
  state.tempo = tempoBase + Math.min(state.combo * 2, 40);
}

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.intervalId = null;
    this.track = null;
    this.isPlaying = false;
  }

  getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  start(track) {
    if (!track) {
      return;
    }
    this.stop();
    this.track = track;
    this.isPlaying = true;
    this.playBeat(track);
    const intervalMs = (60 / track.bpm) * 1000;
    this.intervalId = setInterval(() => this.playBeat(track), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPlaying = false;
  }

  playBeat(track) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = "sawtooth";
    kick.frequency.setValueAtTime(track.style === "gabber" ? 55 : 60, now);
    kickGain.gain.setValueAtTime(0, now);
    kickGain.gain.linearRampToValueAtTime(1, now + 0.02);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    kick.connect(kickGain).connect(ctx.destination);
    kick.start(now);
    kick.stop(now + 0.35);

    const hat = ctx.createOscillator();
    const hatGain = ctx.createGain();
    hat.type = "square";
    hat.frequency.setValueAtTime(1200, now);
    hatGain.gain.setValueAtTime(0.001, now);
    hatGain.gain.linearRampToValueAtTime(0.2, now + 0.005);
    hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    hat.connect(hatGain).connect(ctx.destination);
    hat.start(now);
    hat.stop(now + 0.1);
    if (typeof this.onBeat === "function") {
      this.onBeat(track);
    }
  }
}

const musicEngine = new MusicEngine();
musicEngine.onBeat = () => {
  state.beatPulse = 1;
};

function applyModeSettingsOnStart() {
  applyMode(state.mode);
}

async function loadAssets() {
  try {
    const [musicConfig, levelConfig] = await Promise.all([
      fetch(MUSIC_CONFIG_PATH).then((res) => res.json()),
      fetch(LEVELS_CONFIG_PATH).then((res) => res.json()),
    ]);
    if (musicConfig?.tracks?.length) {
      TRACKS = musicConfig.tracks;
    }
    if (levelConfig?.levels?.length) {
      LEVEL_PATTERNS = levelConfig.levels;
    }
  } catch (error) {
    console.warn("config load failed, using defaults", error);
    TRACKS = [...DEFAULT_TRACKS];
    LEVEL_PATTERNS = [...DEFAULT_LEVEL_PATTERNS];
  }
}

async function initGame() {
  await loadAssets();
  populateMusicTracks();
  const track = selectTrackForLevel(state.level);
  refreshMusicNote();
  if (musicEngine.isPlaying) {
    musicEngine.start(track);
  }
  configureCanvas();
  requestAnimationFrame(loop);
}

if (dom.musicSelect) {
  dom.musicSelect.addEventListener("change", () => {
    const track = getSelectedTrack();
    if (musicEngine.isPlaying) {
      musicEngine.start(track);
      state.status = `Soitetaan ${track.name}`;
    }
    refreshMusicNote();
  });
}

if (dom.musicToggle) {
  dom.musicToggle.addEventListener("click", () => {
    const track = getSelectedTrack();
    if (musicEngine.isPlaying) {
      musicEngine.stop();
      state.status = "Musiikki pysäytetty";
    } else {
      musicEngine.start(track);
      state.status = `Soitetaan ${track.name}`;
    }
    refreshMusicNote();
  });
}

if (modeControl) {
  modeControl.addEventListener("change", () => applyMode(modeControl.value));
}

applyModeSettingsOnStart();
initGame();
