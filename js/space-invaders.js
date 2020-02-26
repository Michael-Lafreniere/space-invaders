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
const LASER_COOLDOWN = 0.5;

// State:
const GAME_STATE = {
  playerX: 0,
  playerY: 0,
  playerLaserCoolDown: 0,
  rightPressed: false,
  leftPressed: false,
  firePressed: false,
  lastTime: Date.now(),
  lasers: []
};

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
  //3
  const laserEffect = new Audio('assets/Sounds/laser3.ogg');
  laserEffect.play();
};

const destroyShot = (laser, container) => {
  container.removeChild(laser.laserContainer);
  laser.isDead = true;
};

const updateShots = dt => {
  const lasers = GAME_STATE.lasers;
  if (lasers) {
    for (let i = 0; i < lasers.length; i++) {
      const laser = lasers[i];
      laser.y -= dt * LASER_MAX_SPEED;
      if (laser.y < 0) destroyShot(laser, gameContainer);
      setPosition(laser.laserContainer, laser.x, laser.y);
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

// Main game update loop:
const update = () => {
  // const gameContainer = document.querySelector('.game');

  // Calculate the delta time between frames:
  const currentTime = Date.now();
  const dt = (currentTime - GAME_STATE.lastTime) / 1000;

  // Update player and player shots:
  updatePlayer(dt);
  updateShots(dt);

  // Update the lastTime to be the currentTime for next frame dt calcs:
  GAME_STATE.lastTime = currentTime;
  window.requestAnimationFrame(update);
};

// Game initialization function:
const initialize = () => {
  const gameContainer = document.querySelector('.game');

  // Register event listeners for key up/down:
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Create the player:
  createPlayer(gameContainer);

  // Create the enemies:
};

// Kick off the update loop:
const run = () => {
  window.requestAnimationFrame(update);
};

// Initialize and run the game:
initialize();
run();
