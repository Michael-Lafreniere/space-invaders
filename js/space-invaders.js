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
let ENEMY_LASER_COOLDOWN = 2.45;
let ENEMY_MAX_LASERS = 10;

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
  topScore: 0
};

// Array of available enemy ship color options:
const enemyShipList = ['Beige', 'Blue', 'Green', 'Pink', 'Yellow'];

// Common DOM element:
const gameContainer = document.querySelector('.game');

// Utility functions:
const restart = () => {
  GAME_STATE.playerLevel = 0;
  GAME_STATE.playerScore = 0;
  writeLocalData();
  window.location.reload();
};

const nextLevel = () => {
  GAME_STATE.playerLevel += 1;
  writeLocalData();
  window.location.reload();
};

const checkTopScore = () => {
  if (GAME_STATE.playerScore > GAME_STATE.topScore) {
    const highScore = new Audio('assets/Sounds/new_highscore.ogg');
    GAME_STATE.topScore = GAME_STATE.playerScore;
    setTimeout(function() {
      highScore.play();
    }, 2100);
    writeLocalData();
    const topScore = document.querySelector('.top-score');
    topScore.textContent = `Top Score: ${GAME_STATE.topScore.toFixed(0)}`;
  }
};

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

function random(min, max) {
  if (min === undefined) min = 0;
  if (max === undefined) max = 1;
  return min + Math.random() * (max - min);
}

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

// Shot handling functions:
const destroyShot = shot => {
  gameContainer.removeChild(shot.element);
  shot.isDead = true;
};

const createPlayerShot = (x, y) => {
  const element = document.createElement('img');
  element.src = `assets/Effects/laserBlue01.png`;
  element.className = 'laser';
  gameContainer.appendChild(element);
  const shot = { x, y, element };
  GAME_STATE.lasers.push(shot);
  setPosition(element, x, y);

  // Play audio for player shots:
  const laserEffect = new Audio('assets/Sounds/laser3.ogg');
  laserEffect.play();
};

const createEnemyShot = (x, y) => {
  if (GAME_STATE.enemyLasers.length < ENEMY_MAX_LASERS) {
    const element = document.createElement('img');
    element.src = 'assets/Effects/laserRed01.png';
    element.className = 'enemy-laser';
    gameContainer.appendChild(element);
    const shot = { x, y, element };
    GAME_STATE.enemyLasers.push(shot);
    setPosition(element, x, y);
  }
};

const updatePlayerShots = dt => {
  const lasers = GAME_STATE.lasers;
  if (lasers) {
    for (let i = 0; i < lasers.length; i++) {
      const laser = lasers[i];
      laser.y -= dt * LASER_MAX_SPEED;
      if (laser.y < 0) destroyShot(laser);
      else setPosition(laser.element, laser.x, laser.y);
      const rect1 = laser.element.getBoundingClientRect();

      const enemies = GAME_STATE.enemies;
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        if (enemy.isDead) continue;
        const rect2 = enemy.enemyShip.getBoundingClientRect();
        if (intersect(rect1, rect2)) {
          destroyEnemy(enemy);
          destroyShot(laser);
          GAME_STATE.playerScore +=
            ENEMY_SHIP_VALUE + GAME_STATE.playerLevel * 1.05;
          break;
        }
      }
    }

    // Filter and remove any dead shots from the array:
    GAME_STATE.lasers = GAME_STATE.lasers.filter(shot => !shot.isDead);
  }
};

const updateEnemyShots = dt => {
  const enemyShots = GAME_STATE.enemyLasers;
  for (let i = 0; i < enemyShots.length; i++) {
    const shot = enemyShots[i];
    shot.y += dt * LASER_MAX_SPEED;
    if (shot.y > GAME_AREA_HEIGHT) destroyShot(shot);
    else setPosition(shot.element, shot.x, shot.y);
    const rect1 = shot.element.getBoundingClientRect();
    const rect2 = document.querySelector('.player').getBoundingClientRect();
    if (intersect(rect1, rect2)) {
      // The player was hit:
      //   destroyPlayer();
      destroyShot(shot);
      //   GAME_STATE.gameOver = true;
      break;
    }
  }

  // Filter and remove any dead shots from the array:
  GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(shot => !shot.isDead);
};

// Player ship functions:
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
  if (player) gameContainer.removeChild(player);
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
    createPlayerShot(GAME_STATE.playerX + PLAYER_WIDTH, GAME_STATE.playerY);
    GAME_STATE.playerLaserCoolDown = LASER_COOLDOWN;
  }

  if (GAME_STATE.playerLaserCoolDown > 0) {
    GAME_STATE.playerLaserCoolDown -= dt;
  }

  // Set player position:
  const player = document.querySelector('.player');
  setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
};

// Enemy functions:
const createEnemyShip = (x, y, index) => {
  const enemyShip = document.createElement('img');
  const color = enemyShipList[index % 5];
  enemyShip.src = `assets/Enemies/ship${color}_manned.png`;
  enemyShip.className = 'enemy';
  gameContainer.appendChild(enemyShip);
  const laserCoolDown = random(0.5, ENEMY_LASER_COOLDOWN);
  const enemy = {
    x,
    y,
    enemyShip,
    cooldown: laserCoolDown
  };
  GAME_STATE.enemies.push(enemy);
  setPosition(enemyShip, x, y);
};

const destroyEnemy = enemy => {
  gameContainer.removeChild(enemy.enemyShip);
  enemy.isDead = true;
  const destroyEnemyShipSound = new Audio('assets/Sounds/phaseJump3.ogg');
  destroyEnemyShipSound.play();
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
      enemy.cooldown -= dt;
      if (enemy.cooldown <= 0) {
        createEnemyShot(x, y);
        enemy.cooldown = ENEMY_LASER_COOLDOWN;
      }
    }

    GAME_STATE.enemies = GAME_STATE.enemies.filter(enemy => !enemy.isDead);
  }
};

// Cleanup game assets:
const cleanupGame = () => {
  // Destroy all our shots:
  const shots = GAME_STATE.lasers;
  for (let i = 0; i < shots.length; i++) {
    destroyShot(shots[i]);
  }
  // Destroy all enemies left case they won:
  const enemies = GAME_STATE.enemies;
  for (let j = 0; j < enemies.length; j++) {
    destroyEnemyShip(enemies[j]);
  }
  // Destroy all enemy shots left:
  const enemyShots = GAME_STATE.enemyLasers;
  for (let k = 0; k < enemyShots.length; k++) {
    shot = enemyShots[k];
    destroyShot(shot);
  }
  // Finally destroy the player so they cannot keep interacting:
  destroyPlayer();
};

// Main game update loop:
const update = () => {
  const topScore = document.querySelector('.top-score');
  const level = document.querySelector('.level');
  const score = document.querySelector('.score');

  // Calculate the delta time between frames:
  const currentTime = Date.now();
  const dt = (currentTime - GAME_STATE.lastTime) / 1000;

  // Did we lose?
  if (GAME_STATE.gameOver) {
    cleanupGame();
    document.querySelector('.lost').style.display = 'block';
    const missionFailed = new Audio('assets/Sounds/mission_failed.ogg');
    missionFailed.play();
    checkTopScore();
    // Update the local stroage for score and level to reset it to a new game:
    GAME_STATE.playerScore = 0;
    GAME_STATE.playerLevel = 0;
    writeLocalData();
    return;
  }

  // Did we complete this level?
  if (GAME_STATE.enemies.length === 0) {
    cleanupGame();
    const objective = new Audio('assets/Sounds/mission_completed.ogg');
    objective.play();
    document.querySelector('.won').style.display = 'block';
    checkTopScore();
    return;
  }

  // Update player and player shots:
  updatePlayer(dt);
  updatePlayerShots(dt);
  // Update enemies and enemy shots:
  updateEnemyShips(dt);
  updateEnemyShots(dt);

  // Update top score, level and score:
  topScore.textContent = `Top Score: ${GAME_STATE.topScore.toFixed(0)}`;
  level.textContent = `Level: ${GAME_STATE.playerLevel + 1}`;
  score.textContent = `Score: ${GAME_STATE.playerScore.toFixed(0)}`;

  // Update the lastTime to be the currentTime for next frame dt calcs:
  GAME_STATE.lastTime = currentTime;
  window.requestAnimationFrame(update);
};

// Creates all the enemy ships for a round:
const createEnemyShips = () => {
  for (let j = 0; j < 3; j++) {
    const y = ENEMY_VERT_PADDING + j * ENEMY_VERT_SPACING;
    for (let i = 0; i < ENEMIES_PER_ROW; i++) {
      const x = i * ENEMY_SPACING + ENEMY_SPACING - ENEMY_SPACING / 2;
      createEnemyShip(x, y, i);
    }
  }
};

// Reads all the previous levels, top scores, etc.
const readLocalData = () => {
  GAME_STATE.playerLevel = JSON.parse(localStorage.getItem('level')) || 0;
  GAME_STATE.playerScore = JSON.parse(localStorage.getItem('score')) || 0;
  GAME_STATE.topScore = JSON.parse(localStorage.getItem('top-score')) || 0;
};

const writeLocalData = () => {
  localStorage.setItem('level', JSON.stringify(GAME_STATE.playerLevel));
  localStorage.setItem('score', JSON.stringify(GAME_STATE.playerScore));
  localStorage.setItem('top-score', JSON.stringify(GAME_STATE.topScore));
};

// Game initialization function:
const initialize = () => {
  // Read previous data:
  readLocalData();

  // Register event listeners for key up/down:
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Create the player:
  createPlayer(gameContainer);

  // Create the enemies:
  createEnemyShips();

  // start the game:
  window.requestAnimationFrame(update);
};

// Initialize and run the game:
initialize();
