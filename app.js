function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = path
    img.onload = () => {
      resolve(img)
    }
  })
}


function createEnemies(ctx, canvas, enemyImg) {
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
  playerImg = await loadTexture('assets/player.png');
  enemyImg = await loadTexture('assets/enemyShip.png');
  laserImg = await loadTexture('assets/laserRed.png')
  
  //Initialization: calling the method for the game init
  initGame();
  
  //Background: canvas of black colour
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //Draw hero: using ctx.drawImage and provided params to center and place the players at the bottom
  ctx.drawImage(playerImg,canvas.width/2 - 45, canvas.height - (canvas.height / 4), 90, 90);

  createEnemies(ctx, canvas, enemyImg);
}

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
    ctx.drawImage(this.img, this.x, this.y,  this.width, this.height);
  }
}

//Both the hero and the enemy will be extensions of the GameObject class [inheritence]
class Hero  extends GameObject{
  //overrides the parent constructor for the last for states
  constructor(x, y) {
    //calling the parent constructor
    super(x, y);

    //overrides original state definitions
    this.width = 98;
    this.height = 75;
    this.type = "Hero";
    this.speed = 5;
  }
} 

class Enemy extends GameObject{
  constructor(x,y){
    //calling the parent constructor
    super(x,y);

    //overrides the original
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";

    //adding an "id" state
    const id = setInterval(() =>{ //setInterval allows for automatic movement of the enemies
      if (this.y < canvas.height - this.height){
        this.y += 5;
      }else{
        console.log('Stopped at', this.y);
        clearInterval(id);
      }
    }, 300);
  }
}

//Event Handling: navigation
const onKeyDown = function (e) {

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
  }
})
//constraints needed for the event emitter class
const Messages = {
  //Message constants reduce the amount of erros associated with typos
  //Ensures easier refactoring
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
};

let heroImg, 
    enemyImg, 
    laserImg,
    canvas, ctx, 
    //Array to hold game objects
    gameObjects = [], 
    hero, 
    eventEmitter = new EventEmitter();

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
  
}

//Game initialization (function)
function initGame(){
  //instantiating the array to store the objects of the game
  gameObjects = [];

  //calling the methods to render the player and enemies
  createEnemies();
  createHero();


  //Actions associated with events in terms of positioning
  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -=5;
  });

  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y +=5;
  });

  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -=5;
  });

  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x +=5;
  });

};

//Method to start the drawing
function drawGameObjects(ctx){
  //ensures iteration through each element intended for rendering
  gameObjects.forEach(go => go.draw(ctx));
}