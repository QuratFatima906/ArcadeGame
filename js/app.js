class Element {
  constructor (x, y, sprite){
    this.x = x;
    this.y = y;
    this.sprite = sprite;
  }
  render() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  }
}

class Enemy extends Element{
  // Variables applied to each of our instances go here,
  // we've provided one for you to get started

  // The image/sprite for our enemies, this uses
  // a helper we've provided to easily load images
  constructor (x, y, speed, player, sprite) {
    super(x,y,sprite);
    this.speed = speed;
    this.player = player;
  }

  // Update the enemy's position, required method for game
  // Parameter: dt, a time delta between ticks
  update(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x = this.x + this.speed*dt;
    //bug width = 100px height = 80px
    //player width = 80px height = 90
    if(this.player.x + 70> this.x && this.player.x < this.x + 100 && this.player.y + 85 > this.y && this.player.y < this.y + 70){
      this.player.collided();
    }
  }  
}

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

class Player extends Element{
  constructor (x, y, dx, dy, sprite) {
    super(x, y, sprite);
    this.dx = dx;
    this.dy = dy;
    this.score = 0;
    this.lives = 3;
    this.hasLost = false;
    this.hasWin = false;
    this.level = 0;
  }

  handleInput(value){
    switch(value){
      case('up'):
      if(this.y - this.dy > 50) {
        this.y -= this.dy;
      }else {
        this.y = 50;
        this.hasWin = true;
          /*Set Record on local Storage
          */
          if(localStorage.getItem('scoreRecord') == null){
            localStorage.setItem('scoreRecord', this.score);
          } else if(parseInt(localStorage.getItem('scoreRecord')) < this.score){
            localStorage.setItem('scoreRecord', this.score);
          }
        }
        break;
        case('down'):
        if(this.y + this.dy < 465) {
          this.y += this.dy
        }else {
          this.y = 465;
        }
        break;
        case('left'):
        if(this.x - this.dx >18) {
          this.x -= this.dx;
        }else {
          this.x = 18;
        }
        break;
        case('right'):
        if(this.x + this.dx < 418) {
          this.x += this.dx;
        }else {
          this.x = 418;
        }
        break;
      }
    }

    updateLevel(){
      if(this.score >= 100 && this.score < 200){
        this.level = 1;
      }
      if(this.score >= 200 && this.score < 300){
        this.level = 2;
      }
      if(this.score >= 300 && this.score < 400){
        this.level = 3;
      }
      if(this.score >= 400){
        this.level = 4;
      }
    }

    render(){
      super.render();

    //draw score
    ctx.beginPath();
    ctx.font = "18pt Montserrat";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: "+ this.score, 8, 40);
    ctx.closePath();

    //draw lives
    ctx.beginPath();
    ctx.font = "18pt Montserrat";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Lives: " + this.lives, 420, 40);
    ctx.closePath();

    //draw level
    ctx.beginPath();
    ctx.font = "18pt Montserrat";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Level: " + (this.level+1), 210, 40);
    ctx.closePath();

  }

  /* Return the Player to original position after a colision
   * If the player as scores the scores will become 0 if not lose one life
   * If no more scores or lifes to lose the player lose the game
   */
   collided(){
    this.x = 220;
    this.y = 465;
    if(this.score > 0 ){
      this.score = 0;
      this.level = 0;
    }else if(this.lives > 0){
      this.lives--;
    }else {
      this.hasLost = true;
    }
  }

  /* Return the the original position
  */
  update() {
    this.x = 220;
    this.y = 465;
    this.score = 0;
    this.lives = 3;
    this.hasLost = false;
    this.hasWin = false;
    this.level = 0;
  }
}

class Bonus extends Element{
  constructor (x, y, sprite, bonus, player){
    super(x,y,sprite)
    this.bonus = bonus;
    this.player = player;
    this.status = 1;
    this.time = new Date().getTime();
  }

  update(){
    if(this.status == 1) {
      if(this.player.x > this.x && this.player.x < this.x + 80 && this.player.y + 5> this.y && this.player.y < this.y + 80) {
        this.status = 0;
        if(this.bonus > 0){
          this.player.score += this.bonus;
          this.player.updateLevel();
        }else {
          //the bonus == 0 its the heart that give a life
          this.player.lives ++;
        }
      }
      /* Give the bonus a 5000ms life
      */
      if (new Date().getTime() - this.time > 5000){
        this.status = 0;
      }
    }
  }

  render() {
    /* if the bonus has been collected or if the lifetime has expired 
     * it should not be rendered
     */
     if(this.status == 1){
      ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    }    
  }
}


//create the enemies and bonus set
let allEnemies = new Set();
let allBonus = new Set();

//Spawn constants
const enemySpawnLineY = [140, 220, 300];
const bonusSpawnLineX = [10,110,213,313, 413];
const bonusSpawnLineY = [133, 215, 300];

/* the player has a level from 0 to 4.
 * each element from the array levels is a array with 3 with the characteristics of each level
 * [speed range, minimum speed, time interval to add new enemies in ms]
 */
 const levels = [[100, 30, 1500], [150, 60, 1100], [200, 90, 900], [250, 120, 750], [300, 150, 500]];

//set time to add new enemies and bonus
let addEnemiesInterval = setInterval(addEnemies, 1500);
//bonus with small value are add often to the game has the bonus with big values
let addSmallBonusInterval = setInterval(addSmallBonus, 3000);
let addBigBonusInterval = setInterval(addBigBonus, 7000);

//the level validator update the addEnemiesInterval when the player change his level
let levelValidator = {
  set : function(player, prop, value){
    if(prop === 'level'){
      clearInterval(addEnemiesInterval);
      addEnemiesInterval = setInterval(addEnemies, levels[value][2]);
    }

    player[prop] = value;
    return true;
  }

};

let player = new Proxy (new Player(218, 465, 100, 84, 'images/char-cat-girl.png'), levelValidator);

//create 4 initial enemies so the screen will not begin empty
for(i = 0; i < 4; i++){
  allEnemies.add(new Enemy(Math.random()*420, enemySpawnLineY[Math.floor(Math.random()*4)], Math.random()*100+30, player, 'images/enemy-bug.png'));
}

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
  var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  if(($('#game-over').is(':visible') || $('#winner').is(':visible')) && e.keyCode == 13){
    playAgain();
  }

  player.handleInput(allowedKeys[e.keyCode]);
});

//add elements to the screen
function addEnemies() {
  allEnemies.add(new Enemy(-100, enemySpawnLineY[Math.floor(Math.random()*3)], Math.random()*levels[player.level][0]+levels[player.level][1], player, 'images/enemy-bug.png'));
}

function addSmallBonus(){
  switch (Math.floor(Math.random()*3)){
    case(0):
    allBonus.add(new Bonus(bonusSpawnLineX[Math.floor(Math.random()*4)], bonusSpawnLineY[Math.floor(Math.random()*3)], 'images/gem-blue.png', 5, player));
    break;
    case(1):
    allBonus.add(new Bonus(bonusSpawnLineX[Math.floor(Math.random()*4)], bonusSpawnLineY[Math.floor(Math.random()*3)], 'images/gem-green.png', 10, player));
    break;
    case(2):
    allBonus.add(new Bonus(bonusSpawnLineX[Math.floor(Math.random()*4)], bonusSpawnLineY[Math.floor(Math.random()*3)], 'images/gem-orange.png', 15, player));
    break;
  }  
}

function addBigBonus(){
  const value = Math.random();
  if(value>0.8) {
    allBonus.add(new Bonus(bonusSpawnLineX[Math.floor(Math.random()*4)], bonusSpawnLineY[Math.floor(Math.random()*3)], 'images/star.png', 50, player));
  }else if (value < 0.15){
    allBonus.add(new Bonus(bonusSpawnLineX[Math.floor(Math.random()*4)], bonusSpawnLineY[Math.floor(Math.random()*3)], 'images/heart.png', 0, player));
  }else {
    allBonus.add(new Bonus(bonusSpawnLineX[Math.floor(Math.random()*4)], bonusSpawnLineY[Math.floor(Math.random()*3)], 'images/key.png', 25, player));
  }
}

function playAgain() {
  $('#winner').fadeOut();
  $('#game-over').fadeOut();
  
  player.update();
  
  for(i = 0; i < 4; i++){
  // add the new object to the objects[] array
  allEnemies.add(new Enemy(Math.random()*420, enemySpawnLineY[Math.floor(Math.random()*4)], Math.random()*100+30, player, 'images/enemy-bug.png'));
}

addSmallBonusInterval = setInterval(addSmallBonus, 3000);
addBigBonusInterval = setInterval(addBigBonus, 7000);
}