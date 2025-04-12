// Constants for game physics and level dimensions
const GRAVITY = 0.5;
const FRICTION = 0.9;
const LEVEL_WIDTH = 2000; // The level is much wider than the 800px canvas

// Keyboard input management
let keys = {};
window.addEventListener("keydown", function(e) { keys[e.code] = true; });
window.addEventListener("keyup", function(e) { keys[e.code] = false; });

// --- Player Class ---
// The player has position, size, velocities, a jumping flag, and an array of collected abilities.
class Player {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velX = 0;
    this.velY = 0;
    this.speed = 4;
    this.jumping = false;
    this.abilities = [];
  }

  update() {
    // Horizontal movement (right and left)
    if (keys["ArrowRight"] || keys["KeyD"]) {
      if (this.velX < this.speed) {
        this.velX++;
      }
    }
    if (keys["ArrowLeft"] || keys["KeyA"]) {
      if (this.velX > -this.speed) {
        this.velX--;
      }
    }
    // Jump if on the ground and the user presses up or W
    if ((keys["ArrowUp"] || keys["KeyW"]) && !this.jumping) {
      this.velY = -10;
      this.jumping = true;
    }

    // Apply gravity
    this.velY += GRAVITY;
    // Update position with velocities
    this.x += this.velX;
    this.y += this.velY;

    // Apply friction to slow horizontal movement gradually
    this.velX *= FRICTION;

    // Constrain the player within the level boundaries
    if (this.x < 0) {
      this.x = 0;
      this.velX = 0;
    }
    if (this.x + this.width > LEVEL_WIDTH) {
      this.x = LEVEL_WIDTH - this.width;
      this.velX = 0;
    }
    // Constrain vertical position to the floor (canvas height)
    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
      this.jumping = false;
      this.velY = 0;
    }
  }

  draw(ctx) {
    ctx.fillStyle = "#F00"; // Red represents the player
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// --- Platform Class ---
// Platforms are static rectangles that the player can land on.
class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(ctx) {
    ctx.fillStyle = "#555"; // Dark gray for platforms
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// --- Collectible Class ---
// Each collectible (a memory piece) has a type and appears as a golden orb.
class Collectible {
  constructor(x, y, size, type) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.collected = false;
  }

  draw(ctx) {
    if (!this.collected) {
      ctx.fillStyle = "#FFD700"; // Gold for collectibles
      ctx.beginPath();
      ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// --- Collision Detection ---
// A simple axis-aligned bounding box (AABB) check between the player and a platform.
function checkCollision(player, platform) {
  return (
    player.x < platform.x + platform.width &&
    player.x + player.width > platform.x &&
    player.y < platform.y + platform.height &&
    player.y + player.height > platform.y
  );
}

// Get canvas element and its 2D drawing context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Create the player at the start of the level
const player = new Player(50, 300, 30, 30);

// Create an array of platforms that span a longer level
const platforms = [
  new Platform(0, 580, LEVEL_WIDTH, 20), // Ground across the whole level
  new Platform(200, 500, 150, 10),
  new Platform(500, 450, 150, 10),
  new Platform(800, 400, 150, 10),
  new Platform(1100, 350, 150, 10),
  new Platform(1400, 300, 150, 10),
  new Platform(1700, 250, 150, 10)
];

// Place collectibles on some platforms
const collectibles = [
  new Collectible(250, 460, 20, "speed"),
  new Collectible(550, 410, 20, "jump"),
  new Collectible(850, 360, 20, "dash"),
  new Collectible(1150, 310, 20, "shield"),
  new Collectible(1450, 260, 20, "invisibility"),
  new Collectible(1750, 210, 20, "strength")
];

// --- Main Game Loop ---
// Updates game state, handles collisions, draws with a scrolling camera, and schedules the next frame.
function gameLoop() {
  // Clear the canvas for the new frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update player state (physics, movement)
  player.update();

  // Collision check: Platforms
  platforms.forEach(function(platform) {
    if (checkCollision(player, platform)) {
      // If the player is falling, land on the platform
      if (player.velY > 0) {
        player.y = platform.y - player.height;
        player.velY = 0;
        player.jumping = false;
      }
    }
  });

  // Collision check: Collectibles
  collectibles.forEach(function(collectible) {
    if (!collectible.collected &&
        player.x < collectible.x + collectible.size &&
        player.x + player.width > collectible.x &&
        player.y < collectible.y + collectible.size &&
        player.y + player.height > collectible.y) {
      collectible.collected = true;
      player.abilities.push(collectible.type);
      console.log("Collected:", collectible.type);
    }
  });

  // Calculate the camera offset to keep the player centered horizontally
  let cameraX = player.x - canvas.width / 2;
  // Clamp the camera offset within the level boundaries
  cameraX = Math.max(0, Math.min(cameraX, LEVEL_WIDTH - canvas.width));

  // Save the context state and apply the camera transformation
  ctx.save();
  ctx.translate(-cameraX, 0);

  // Draw the level background (a simple color fill)
  ctx.fillStyle = "#4ca1af";
  ctx.fillRect(0, 0, LEVEL_WIDTH, canvas.height);

  // Draw world objects: platforms, collectibles, and the player
  platforms.forEach(platform => platform.draw(ctx));
  collectibles.forEach(collectible => collectible.draw(ctx));
  player.draw(ctx);

  // Restore the context state (removes camera translation for any overlays)
  ctx.restore();

  // Request the next frame of the animation
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
