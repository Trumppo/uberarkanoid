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
let bricks = [];
let uberActive = false;
let uberExpires = 0;
let powerUps = [];
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
const BEAT_DECAY = 3;
const TRACKS = [
  { id: "tekno-pulse", name: "Tekno Pulse", style: "tekno", bpm: 142 },
  { id: "gabber-core", name: "Gabber Core", style: "gabber", bpm: 175 },
  { id: "acid-tekno", name: "Acid Tekno", style: "tekno", bpm: 150 },
];

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
}

function buildBricks(level = state.level) {
  const rows = computeBrickRows(level, BRICK_BASE_ROWS, BRICK_MAX_EXTRA_ROWS);
  state.currentRows = rows;
  state.totalBricks = rows * BRICK_COLS;
  bricks = [];
  const totalPadding = BRICK_PADDING * (BRICK_COLS - 1);
  const width = (canvas.width - BRICK_OFFSET_SIDE * 2 - totalPadding) / BRICK_COLS;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < BRICK_COLS; col += 1) {
      const x =
        BRICK_OFFSET_SIDE + col * (width + BRICK_PADDING);
      const y =
        BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING);
      bricks.push({
        x,
        y,
        width,
        height: BRICK_HEIGHT,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
        alive: true,
      });
    }
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
    state.status = "Power-up ohi";
  }

  if (slowActive && timestampMs >= slowExpires) {
    slowActive = false;
    state.status = "Slow motion ohi";
  }

  if (state.beatPulse > 0) {
    state.beatPulse = Math.max(0, state.beatPulse - dt * BEAT_DECAY);
  }

  if (!state.running) {
    return;
  }

  const motionFactor = slowActive ? SLOW_MULTIPLIER : 1;
  ball.x += ball.vx * dt * motionFactor;
  ball.y += ball.vy * dt * motionFactor;

  if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
    ball.vx *= -1;
  }
  if (ball.y - ball.radius <= 0) {
    ball.vy *= -1;
    updateScore(10);
  }

  handleBrickCollisions(timestampMs);
  updatePowerUps(dt, timestampMs);

  if (
    ball.y + ball.radius >= paddle.y &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
  ) {
    ball.y = paddle.y - ball.radius;
    ball.vy *= -1;
    state.combo += 1;
    const tempoBase = 120 + (state.modeTempoBoost || 0);
    state.tempo = tempoBase + Math.min(state.combo * 2, 40);
    state.uber = Math.min(state.uber + 5, 100);
  }

  if (ball.y - ball.radius > canvas.height) {
    state.lives -= 1;
    state.combo = 0;
    state.status = state.lives > 0 ? "Paina välilyöntiä jatkaaksesi" : "Peli ohi — lataa sivu uudelleen";
    state.running = false;
    resetBall(false);
  }
}

function updateScore(amount) {
  state.score += amount;
  dom.score.textContent = String(state.score).padStart(4, "0");
  if (state.score > state.highScore) {
    state.highScore = state.score;
    persistHighScore(state.highScore);
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

function drawBall() {
  const gradient = ctx.createRadialGradient(
    ball.x,
    ball.y,
    0,
    ball.x,
    ball.y,
    ball.radius * 1.8
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "rgba(99, 255, 186, 0.7)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
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

function handleBrickCollisions(timestampMs) {
  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }
    const hitsX =
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width;
    const hitsY =
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height;
    if (hitsX && hitsY) {
      brick.alive = false;
      ball.vy *= -1;
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
  const cleared = bricks.every((brick) => !brick.alive);
  if (cleared) {
    advanceLevel();
  }
}

function activateUber(timestampMs) {
  uberActive = true;
  uberExpires = timestampMs + UBER_DURATION;
  paddle.width = BASE_PADDLE_WIDTH + UBER_WIDTH_BONUS;
  paddle.x = clamp(paddle.x - UBER_WIDTH_BONUS / 2, 0, canvas.width - paddle.width);
  state.status = "Uber-tila!";
  state.uber = 50;
}

function maybeSpawnPowerUp(brick) {
  if (Math.random() >= POWERUP_DROP_CHANCE) {
    return;
  }
  powerUps.push({
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height + 4,
    vy: POWERUP_SPEED,
    type: Math.random() < 0.5 ? "score" : "slow",
    alive: true,
  });
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

function activatePowerUp(type, timestampMs) {
  if (type === "score") {
    state.scoreMultiplier = 2;
    powerupExpires = timestampMs + POWERUP_DURATION;
    state.status = "Score boost!";
    return;
  }
  if (type === "slow") {
    slowActive = true;
    slowExpires = timestampMs + SLOW_DURATION;
    state.status = "Slow motion!";
  }
}

function advanceLevel() {
  state.level += 1;
  const track = selectTrackForLevel(state.level);
  state.status = `Level ${state.level} aloitettu — ${track.name}`;
  state.uber = Math.min(state.uber + 20, 100);
  state.combo = 0;
  state.scoreMultiplier = 1;
  powerupExpires = 0;
  powerUps = [];
  buildBricks(state.level);
  resetBall(false);
  refreshMusicNote();
  if (musicEngine.isPlaying) {
    musicEngine.start(track);
  }
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

function populateMusicTracks() {
  if (!dom.musicSelect) {
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
  const styleLabel = formatStyle(track.style);
  if (dom.musicNote) {
    dom.musicNote.textContent = `${track.name} — ${styleLabel} ${track.bpm} bpm`;
  }
  if (dom.musicToggle) {
    dom.musicToggle.textContent = musicEngine.isPlaying ? "Stop" : `Play ${styleLabel}`;
  }
}

function selectTrackForLevel(level) {
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

function draw() {
  drawBackgroundGrid();
  drawBricks();
  drawPowerUps();
  drawPaddle();
  drawBall();
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
  draw();
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

populateMusicTracks();
selectTrackForLevel(state.level);
refreshMusicNote();

if (dom.musicSelect) {
  dom.musicSelect.addEventListener("change", () => {
    if (musicEngine.isPlaying) {
      musicEngine.start(getSelectedTrack());
      state.status = `Soitetaan ${getSelectedTrack().name}`;
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

applyMode(state.mode);
configureCanvas();
requestAnimationFrame(loop);
