let gameLoopId;

//GameObject class is considered to be the basis of the program
//It acts as the defintion of the comon properties including the position, size and image
class GameObject{
  
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.dead = false; //FLAG: makes sense initially 
    this.type = "";
    this.width = 0;
    this.height = 0;
    this.img = undefined;
  }

  //Rendering: objects onto the canvas
  draw(ctx){
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
  
  //Boundary: coordinates for each object
  rectFromGameObject(){
    //Rectangle w/ precise boundary coordinates
    //Return: object that can be used to detect collisions
    return{
      top: this.y,
      left: this.x,
      bottom: this.y+this.height,
      right: this.x+this.width,
    };
  }
}


//Intersection: Uses the boundary rectangles to test separation conditions
  function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = path
    img.onload = () => {
      resolve(img);
    }
  })
}

//Publishing and subscription to msgs
class EventEmitter{
  constructor(){
    this.listeners = {};
  }

  on(msg, listener){
    if(!this.listeners[msg]){
      this.listeners[msg] = [];
    }
    this.listeners[msg].push(listener);
  }

  emit(msg, payload = null) {
    if (this.listeners[msg]) {
      this.listeners[msg].forEach(l => l(msg, payload));
    }
  }

  //Needed for reset
  clear() {
    this.listeners = {};
  }
}

function createEnemies() {
  //Constants: needed for the layout of the ships into correct positions
  //This creates a grid (5 by 5) ensuring there is enough space and width
  //The start and stop of the formation are determined to later dtermined the center
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * 98;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;

  //Nested loop: assignment of enemy image to enemy obj
  for (let i = START_X; i < STOP_X; i += 98) {
    for (let j = 0; j < 50 * 5; j += 50) {
      const enemy = new Enemy(i, j);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }

}

//Function to crate player (hero)
function createHero(){
  //instatntiation of the new player (hero)
  hero = new Hero(
    //positioning of the hero (bottom of the screen)
    canvas.width/2 -45,
    canvas.height - canvas.height/4
  );

  //image to the hero
  hero.img = heroImg;

  //addition of the hero to the objects of the game for rendering purposes
  gameObjects.push(hero);
}

window.onload = async () => {
  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')

  //Game Textures: using await loadAsset(path) player and enemy images to be loaded
  heroImg = await loadTexture('assets/hero.png');
  enemyImg = await loadTexture('assets/enemyShip.png');
  laserImg = await loadTexture('assets/laserRed.png')
  lifeImg = await loadTexture("assets/life.png");

  //Initialization: calling the method for the game init
  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPoints();
		drawLife();
		updateGameObjects();
		drawGameObjects(ctx);
  }, 16);
}


//Both the hero and the enemy will be extensions of the GameObject class [inheritence]
class Hero  extends GameObject{
  //overrides the parent constructor for the last for states
  constructor(x, y) {
    //calling the parent constructor
    super(x, y);

    //overrides original state definitions
    this.width = 99;
    this.height = 75;
    this.type = 'Hero';
    this.speed = { x: 0, y: 0 };
    //Initialization of the cooldown timer
    this.cooldown = 0;
    this.life = 3;
    this.points = 0;

  
  }

  fire() {
    //Positioning of the lasers above the hero ship
    gameObjects.push(new Laser(this.x + 45, this.y - 10));
    this.cooldown = 500;

    //Decrement of the timer using interval-based upds.
    let id = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown -= 100;
      } else {
        clearInterval(id);
      }
    }, 200);
  }
  
  //MEthod to check firing status
  canFire() {
    return this.cooldown === 0;
  }

  incrementPoints() {
    this.points += 100;
  }

  //Method to decrement the life of the player
  decrementLife() {
    this.life--;
    if (this.life === 0) {
      this.dead = true;
    }
  }
} 

class Enemy extends GameObject{
  constructor(x,y){
    //calling the parent constructor
    super(x,y);

    //overrides the original
    this.width = 98;
    this.height = 50;
    this.type = 'Enemy';

    //adding an "id" state
    let id = setInterval(() => {
			if (this.y < canvas.height - this.height) {
				this.y += 5;
			} else {
				console.log('Stopped at', this.y);
				clearInterval(id);
			}
		}, 300);
    
  }
}

//Laser class: projectiles that will be moving upwards
class Laser extends GameObject {
  //Inheritence: from GameObject for basic function
  constructor(x, y) {
    super(x, y);

    //Dimensions for the laser sprite
    this.width = 9;
    this.height = 33;
    this.type = 'Laser';
    this.img = laserImg;
    
    //setInterval() creates the automatic upward movement
    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 15;
      } else { 
        //self destruction when reaches top
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

//Collision detection:
function updateGameObjects() {
  const enemies = gameObjects.filter(go => go.type === 'Enemy');
  const lasers = gameObjects.filter(go => go.type === 'Laser');
  
  //Tests intersections between the laser and enemy (nested loop)
  lasers.forEach((laser) => {
    enemies.forEach((enemy) => {
      if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: laser,
          second: enemy,
        });
      }
    });
  });

  //Occurence of the collision
  enemies.forEach(enemy => {
    const heroRect = hero.rectFromGameObject();
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  })

  //Removal of detroyed objects
  gameObjects = gameObjects.filter(go => !go.dead);

}

//Event Handling: navigation
let onKeyDown = function (e) {

  //Logs: debugging purposes - keys identification
  console.log(e.keyCode);

  // Add the code from the lesson above to stop default behavior
  switch (e.keyCode) {
    case 37:
    case 39:
    case 38:
    case 40: // Arrow keys
    case 32:

      //Prevention of default browser behaviour
      e.preventDefault();
      break; // Space
    default:
      break; // do not block other keys

      //other keys are functioning normally
  }
};
//Event handler: listens for keydown events [scope: window]
window.addEventListener("keydown", onKeyDown);


//Keyboard -> game events:
window.addEventListener("keyup", (evt)=>{
  //Conditional statements detect keyboard input 
  //Depending on the input, game events are emitted
  if(evt.key === "ArrowUp"){
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  }else if(evt.key === "ArrowDown"){
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  }else if(evt.key === "ArrowLeft"){
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  }else if(evt.key === "ArrowRight"){
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  } else if(evt.key === " ") {
  eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  } else if(evt.key === "Enter") {
   eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
});


//constraints needed for the event emitter class
const Messages = {
  //Message constants reduce the amount of erros associated with typos
  //Ensures easier refactoring
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
  GAME_END_LOSS: "GAME_END_LOSS",
  GAME_END_WIN: "GAME_END_WIN",
};

let heroImg, 
    enemyImg, 
    laserImg,
    lifeImg,
    canvas, ctx, 
    //Array to hold game objects
    gameObjects = [], 
    hero, 
    eventEmitter = new EventEmitter();



//Game initialization (function)
function initGame(){
  //instantiating the array to store the objects of the game
  gameObjects = [];

  //calling the methods to render the player and enemies
  createEnemies();
  createHero();


  //Actions associated with events in terms of positioning
  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -=15;
  });

  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y +=15;
  });

  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -=15;
  });

  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x +=15;
  });

  //Firing behaviour
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
        hero.fire();
    }
  });

 //Collision handling
eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    hero.incrementPoints();

    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
});

eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife();
    if (isHeroDead())  {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return; // loss before victory
    }
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
});

eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
});
  
eventEmitter.on(Messages.GAME_END_LOSS, () => {
  endGame(false);
});

//Key event to reset the game functionality for the next session
eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
  resetGame();
});


};

//Method to start the drawing
function drawGameObjects(ctx){
  //ensures iteration through each element intended for rendering
  gameObjects.forEach(go => go.draw(ctx));
}

function drawLife() {
  // TODO, 35, 27
  const START_POS = canvas.width - 180;
  for(let i=0; i < hero.life; i++) {
    ctx.drawImage(
      lifeImg, 
      START_POS + (45 * (i+1) ), 
      canvas.height - 37);
  }
}

function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height-20);
}

function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}


//Methods to check if the player is out of lives
function isHeroDead() {
  return hero.life <= 0;
}

//Method to count the amount of enemies and determine if the battlefield is clear
function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0;
}

//Method to display the messages to the player
function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

//Method to end the game
function endGame(win) { 
  clearInterval(gameLoopId);

  //Delay intended to ensure all renders are complete
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (win) {
      displayMessage(
        "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
        "green"
      );
    } else {
      displayMessage(
        "You died !!! Press [Enter] to start a new game Captain Pew Pew"
      );
    }
  }, 200)  
}

//Initialization of a fresh game session
function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    eventEmitter.clear();
    initGame();
    gameLoopId = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawPoints();
      drawLife();
      updateGameObjects();
      drawGameObjects(ctx);
    }, 16);
  }
}