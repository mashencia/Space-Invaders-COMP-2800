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
  const ENEMY_TOTAL = 5;
  const ENEMY_SPACING = 98;
  const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING;
  const START_X = (canvas.width - FORMATION_WIDTH) / 2;
  const STOP_X = START_X + FORMATION_WIDTH;

  //Nested loop: allows the movement in the x and y directions
  for (let x = START_X; x < STOP_X; x += ENEMY_SPACING){
    for (let y = 0; y < 50 * 5; y += 50){
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

window.onload = async () => {
  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')

  //Game Textures: using await loadAsset(path) player and enemy images to be loaded
  const playerImg = await loadTexture('assets/player.png');
  const enemyImg = await loadTexture('assets/enemyShip.png');

  //Background: canvas of black colour
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //Draw hero: using ctx.drawImage and provided params to center and place the players at the bottom
  ctx.drawImage(playerImg,canvas.width/2 - 45, canvas.height - (canvas.height / 4), 90, 90);

  createEnemies(ctx, canvas, enemyImg);
}