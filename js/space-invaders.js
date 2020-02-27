// Global Defines:
const GAME_AREA_WIDTH = 800;
const GAME_AREA_HEIGHT = 600;

const KEY_SPACE = 32;
const KEY_LEFT = 37;
const KEY_RIGHT = 39;

const PLAYER_Y_OFFSET = 45;
const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 450;

const LASER_MAX_SPEED = 250;
const LASER_COOLDOWN = 0.45;
let ENEMY_LASER_MAX_SPEED = 250;
let ENEMY_LASER_COOLDOWN = 0.45;

const ENEMIES_PER_ROW = 8;
const ENEMY_SHIP_VALUE = 50;
const ENEMY_EDGE_PADDING = 65;
const ENEMY_VERT_PADDING = 70;
const ENEMY_VERT_SPACING = 80;
const ENEMY_SPACING =
  (GAME_AREA_WIDTH - ENEMY_EDGE_PADDING * 2) / (ENEMIES_PER_ROW - 1);

// State:
const GAME_STATE = {
  playerX: 0,
  playerY: 0,
  playerScore: 0,
  playerLevel: 0,
  playerLaserCoolDown: 0,
  rightPressed: false,
  leftPressed: false,
  firePressed: false,
  lastTime: Date.now(),
  lasers: [],
  enemies: [],
  enemyLasers: [],
  gameOver: false,
  gameWon: false,
  gameStart: false
};

// Array of available enemy ship color options:
const enemyShipList = ['Beige', 'Blue', 'Green', 'Pink', 'Yellow'];

// Common DOM element:
const gameContainer = document.querySelector('.game');

// Utility functions:
const setPosition = (element, x, y) => {
  element.style.transform = `translate(${x}px, ${y}px)`;
};

const clamp = (value, min, max) => {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  } else return value;
};

const intersect = (rect1, rect2) => {
  return !(
    rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top
  );
};

const onKeyDown = event => {
  switch (event.keyCode) {
    case KEY_RIGHT:
      GAME_STATE.rightPressed = true;
      break;
    case KEY_LEFT:
      GAME_STATE.leftPressed = true;
      break;
    case KEY_SPACE:
      GAME_STATE.firePressed = true;
      break;
  }
};

const onKeyUp = event => {
  switch (event.keyCode) {
    case KEY_RIGHT:
      GAME_STATE.rightPressed = false;
      break;
    case KEY_LEFT:
      GAME_STATE.leftPressed = false;
      break;
    case KEY_SPACE:
      GAME_STATE.firePressed = false;
      break;
  }
};

// Generic game functions:
const createShot = (x, y) => {
  const laserContainer = document.createElement('img');
  laserContainer.src = 'assets/Effects/laserBlue01.png';
  laserContainer.className = 'laser';
  gameContainer.appendChild(laserContainer);
  const laser = { x, y, laserContainer };
  GAME_STATE.lasers.push(laser);
  setPosition(laserContainer, x, y);
  const laserEffect = new Audio('assets/Sounds/laser3.ogg');
  laserEffect.play();
};

const destroyShot = laser => {
  gameContainer.removeChild(laser.laserContainer);
  laser.isDead = true;
};

const updateShots = dt => {
  const lasers = GAME_STATE.lasers;
  if (lasers) {
    for (let i = 0; i < lasers.length; i++) {
      const laser = lasers[i];
      laser.y -= dt * LASER_MAX_SPEED;
      if (laser.y < 0) destroyShot(laser);
      setPosition(laser.laserContainer, laser.x, laser.y);
      const rect1 = laser.laserContainer.getBoundingClientRect();

      const enemies = GAME_STATE.enemies;
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        if (enemy.isDead) continue;
        const rect2 = enemy.enemyShip.getBoundingClientRect();
        if (intersect(rect1, rect2)) {
          destroyEnemy(enemy);
          destroyShot(laser);
          GAME_STATE.playerScore += ENEMY_SHIP_VALUE;
          break;
        }
      }
    }

    // Filter and remove any dead lasers from the array:
    GAME_STATE.lasers = GAME_STATE.lasers.filter(laser => !laser.isDead);
  }
};

// Player functions:
const createPlayer = container => {
  GAME_STATE.playerX = GAME_AREA_WIDTH / 2;
  GAME_STATE.playerY = GAME_AREA_HEIGHT - PLAYER_Y_OFFSET;
  const player = document.createElement('img');
  player.src = 'assets/Ships/spaceShips_001.png';
  player.className = 'player';
  container.appendChild(player);
  setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
};

const destroyPlayer = () => {
  const player = document.querySelector('.player');
  gameContainer.removeChild(player);
  GAME_STATE.gameOver = true;
};

const updatePlayer = dt => {
  const speed = dt * PLAYER_MAX_SPEED;
  if (GAME_STATE.leftPressed) GAME_STATE.playerX -= speed;
  if (GAME_STATE.rightPressed) GAME_STATE.playerX += speed;

  // Clamp player within the playing field:
  GAME_STATE.playerX = clamp(
    GAME_STATE.playerX,
    0,
    GAME_AREA_WIDTH - PLAYER_WIDTH * 2
  );

  // If space was pressed and we're off cool down, fire a laser:
  if (GAME_STATE.firePressed && GAME_STATE.playerLaserCoolDown <= 0) {
    createShot(GAME_STATE.playerX + PLAYER_WIDTH, GAME_STATE.playerY);
    GAME_STATE.playerLaserCoolDown = LASER_COOLDOWN;
  }

  if (GAME_STATE.playerLaserCoolDown > 0) {
    GAME_STATE.playerLaserCoolDown -= dt;
  }

  // Set player position:
  const player = document.querySelector('.player');
  setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
  // console.log(GAME_STATE.playerX, GAME_STATE.playerY);
};

// Enemy functions:
const createEnemyShip = (x, y, index) => {
  const enemyShip = document.createElement('img');
  const color = enemyShipList[index % 5];
  enemyShip.src = `assets/Enemies/ship${color}_manned.png`;
  enemyShip.className = 'enemy';
  gameContainer.appendChild(enemyShip);
  const enemy = { x, y, enemyShip };
  GAME_STATE.enemies.push(enemy);
  setPosition(enemyShip, x, y);
};

const destroyEnemy = enemy => {
  gameContainer.removeChild(enemy.enemyShip);
  enemy.isDead = true;
  const destroyEnemyShip = new Audio('assets/Sounds/phaseJump3.ogg');
  destroyEnemyShip.play();
};

const updateEnemyShips = dt => {
  const time = GAME_STATE.lastTime / 1000;
  const dx = Math.sin(time) * 40;
  const dy = Math.cos(time) * 10;

  const enemies = GAME_STATE.enemies;
  if (enemies) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const x = enemy.x + dx;
      const y = enemy.y + dy;
      setPosition(enemy.enemyShip, x, y);
    }

    GAME_STATE.enemies = GAME_STATE.enemies.filter(enemy => !enemy.isDead);
  }
};

const createEnemyShot = (x, y) => {
  const enemyLaser = document.createElement('img');
  enemyLaser.src = 'assets/Effects/laserRed01.png';
  enemyLaser.className = 'enemy-laser';
  gameContainer.appendChild(enemyLaser);
  const laser = { x, y, enemyLaser };
  GAME_STATE.enemyLasers.push(laser);
  setPosition(enemyLaser, x, y);
};

const updateEnemyShots = dt => {
  const shots = GAME_STATE.enemyLasers;
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    shot.y += dt * LASER_MAX_SPEED;
    if (shot.y > GAME_AREA_HEIGHT) {
      destroyShot(shot);
    }
    setPosition(shot, shot.x, shot.y);
    const rect1 = laser.enemyLaser.getBoundingClientRect();
    const rect2 = document.querySelector('.player').getBoundingClientRect();
    if (intersect(rect1, rect2)) {
      destroyPlayer();
      destroyShot(shot);
      break;
    }
  }
};

// Main game update loop:
const update = () => {
  const score = document.querySelector('.score');

  // Calculate the delta time between frames:
  const currentTime = Date.now();
  const dt = (currentTime - GAME_STATE.lastTime) / 1000;

  if (GAME_STATE.gameOver) {
    document.querySelector('.lost').style.display = 'block';
    const missionFailed = new Audio('assets/Sounds/mission_failed.ogg');
    missionFailed.play();
    return;
  }

  // Update player and player shots:
  updatePlayer(dt);
  updateShots(dt);
  updateEnemyShips(dt);

  score.textContent = `Score: ${GAME_STATE.playerScore}`;

  // Update the lastTime to be the currentTime for next frame dt calcs:
  GAME_STATE.lastTime = currentTime;
  window.requestAnimationFrame(update);
};

// Game initialization function:
const initialize = () => {
  const gameContainer = document.querySelector('.game');
  const level = document.querySelector('.level');
  level.textContent = `Score: ${GAME_STATE.playerLevel}`;

  // Register event listeners for key up/down:
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Create the player:
  createPlayer(gameContainer);

  // Create the enemies:
  for (let j = 0; j < 3; j++) {
    const y = ENEMY_VERT_PADDING + j * ENEMY_VERT_SPACING;
    for (let i = 0; i < ENEMIES_PER_ROW; i++) {
      const x = i * ENEMY_SPACING + ENEMY_SPACING - ENEMY_SPACING / 2;
      createEnemyShip(x, y, i);
    }
  }
};

// Kick off the update loop:
const run = () => {
  window.requestAnimationFrame(update);
};

// Initialize and run the game:
initialize();
run();
