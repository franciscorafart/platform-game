let simpleLevelPlan = [
  "                      ",
  "                      ",
  "  x              = x  ",
  "  x         o o    x  ",
  "  x @      xxxxx   x  ",
  "  xxxxx            x  ",
  "      x!!!!!!!!!!!!x  ",
  "      xxxxxxxxxxxxxx  ",
  "                      "
]
//actor char object

let actorChar = {
  "@": Player,
  "o": Coin,
  "=": Lava, "|":Lava, "v": Lava
}

let maxStep = 0.05
let wobbleSpeed = 8, wobbleDist = 0.07;
let playerSpeed = 7
let gravity = 30
let jumpSpeed = 17
let arrowCodes = {37:"left", 38: "up", 39:"right"}
let arrows = trackKeys(arrowCodes)
var simpleLevel = new Level(simpleLevelPlan);
var display = new DOMDisplay(document.body, simpleLevel);

//Object to read the level
function Level(plan){
  this.width = plan[0].length
  this.height = plan.length
  //grid array will contain line arrays
  this.grid = []
  this.actors = []

  for (let y = 0; y< this.height ; y++){
    let line = plan[y], gridLine = []

    for(let x = 0; x<this.width; x++){
      //character in coordinate a fieldType that will be forst null, in case the car represents and actor in the game
      let ch = line[x], fieldType = null;
      //extract which actor is the character in the coordinate
      let Actor = actorChar[ch]
      //if the actor exists push it as a new Actor Object to the actors property, with its coordinate
      if(Actor)
        this.actors.push(new Actor(new Vector(x,y),ch))
          //each Actor will have a size property, a position coordinate and a type property.
      //if ch is wall or lava change fieldType, because it's not null
      else if (ch == 'x')
        fieldType = 'wall'
      else if (ch == '!')
        fieldType = 'lava'
      gridLine.push(fieldType) //push to the grid line the field Type: Actor, wall or null
    }
    //push the whole line with fieldTypes the grid
    this.grid.push(gridLine)
  }
  //filter method to find the players object, stored in a property of the level
  this.player = this.actors.filter(function(actor){
    return actor.type == 'player'
  })[0]
  //finish delay so that the world doesn't finish eight away when the player dies
  this.status = this.finishDelay = null
}

//Method to find if level is finished

Level.prototype.isFinished = function(){
  return this.status != null && this.finishDelay < 0
}

//Motion method
// obstacleAt method tells if a rectangle overlaps with another non-empty space, and returns the object encountered
Level.prototype.obstacleAt = function(pos,size){
  //define limits of space used by player in Level according to size and position
  let xStart = Math.floor(pos.x)
  let xEnd = Math.ceil(pos.x + size.x)
  let yStart = Math.floor(pos.y)
  let yEnd = Math.ceil(pos.y + size.y)

  if(xStart < 0 || xEnd > this.width || yStart<0)
    return "wall"
  if(yEnd > this.height)
  //lava at the bottom ensures player dies if they fall
    return "lava"
  for(let y = yStart; y < yEnd; y++){
    for (let x = xStart; x < xEnd; x++){
      //look for field type
      let fieldType = this.grid[y][x]
      //if fieldType not null (not empty space), return what the field type is
      //return content of first non empty space we find
      if (fieldType) return fieldType
    }
  }
}

//Collisions with coins or lava are handles after the player moves

//This method looks for actor that overlaps the one given as an argument
Level.prototype.actorAt = function(actor){
  for (let i = 0; i<this.actors.length; i++){
    let other = this.actor[i]
    if (other != actor &&
      actor.pos.x + actor.size.x > other.pos.x &&
      actor.pos.x < other.pos.x + other.size.x &&
      actor.pos.y + actor.size.y > other.pos.y &&
      actor.pos.y < other.pos.y + other.size.y)
    return other
  }
}

//Method give every actor in the game a chance to move. Step is the time step in seconds.
//Keys contains information about the keyboard arrow keys the user has pressed
Level.prototype.animate = function(step, keys){

  //if player has won or lost, finish delay is substracted
  if(this.status != null)
    this.finishDelay -= step

  //cut timestep into suitable smaller pieces
  while(step > 0){
    let thisStep = Math.min(step, maxStep)
    //all actors act
    this.actors.forEach(function(actor){

      actor.act(thisStep, this, keys)
    }, this)
    //take time away from the step
    step -= thisStep
  }
}

Level.prototype.playerTouched = function(type, actor){
  //if lava touched, level status equals 'lost'
  if (type == "lava" && this.status == null){
    this.status = "lost"
    this.finishDelay = 1
    //if its a coint, that coin is removes
  } else if (type == "coin"){
    this.actors = this.actors.filter((other)=>{
      return other != actor
    })
    //if it was the last coin, level status set to "won"
    if (!this.actors.some((actor)=>{
      return actor.type == "coin"
    })) {
      this.status = "won"
      this.finishDelay = 1
    }
  }
}

//Actor code

function Vector(x,y){
  this.x = x; this.y = y;
}

//add two vectors
Vector.prototype.plus = function(other){
  return new Vector(this.x + other.x, this.y + other.y)
}
//multiply the scale of a vector
Vector.prototype.times = function(factor){
  return new Vector(this.x * factor, this.y * factor)
}

//Player Object

function Player(pos){
  this.pos = pos.plus(new Vector(0, -0.5))
  this.size = new Vector(0.8, 1.5)
  this.speed = new Vector(0,0)
}
Player.prototype.type = "player"

//Player action
Player.prototype.moveX = function(step, level, keys){
  this.speed.x = 0
  //direction of movement
  if (keys.left) this.speed.x -= playerXSpeed
  if(keys.right) this.speed.x += playerXSpeed

  let motion = new Vector(this.speed * step, 0)
  let newPos = this.pos.plus(motion)
  //see if there's obstacle at new position
  let obstacle = level.obstacleAt(newPos, this.size)
  //id there's an obstacle,call playerTouched function
  if (obstacle)
    level.playerTouched(obstacle)
  //if no obstacle, move there
  else
    this.pos = newPos
}

Player.prototype.moveY = function(step,level,keys){
  this.speed.y += step * gravity //initialize accelerating vertically due to gravity
  let motion = new Vector(0,this.speed.y * step)
  let newPos = this.pos.plus(motion)

  let obstacle = level.obstacleAt(newPos,this.size)
  //if obstacle existes
  if (obstacle){
    //run playerTouched
    level.playerTouched(obstacle)
    //remove jump speed or 0 if it is the ground
    if(keys.up && this.speed.y > 0)
      this.speed.y -= jumpSpeed
    else
      this.speed.y = 0
  } else{
    //move to position if there's no obstacle
    this.pos = newPos
  }
}

//Player act

Player.prototype.act = function(step, level, keys){
  this.moveX(step, level, keys)
  this.moveY(step, level, keys)

  let otherActor = level.actorAt(this)
  //if collision with another actor --> playerTouched. Passes other actor, to know which type of actor is touching
  if (otherActor)
    level.playerTouched(otherActor.type,otherActor)
  //Loosing animation --> shrinking player
  if (level.status == "lost")
    this.pos.y += step
    this.size.y -= step
}



//Lava Object
//Initialized different depending on the character it has
function Lava(pos,ch){
  this.pos = pos
  this.size = new Vector(1,1)
  //speeds (with direction) different depending on lava character
  if (ch == "="){
    this.speed = new Vector(2,0)
  } else if (ch == "|"){
    this.speed = new Vector(0,2)
  } else if (ch == "v"){
    this.speed = new Vector(0,3)
    this.repeatPos = pos
  }
}
Lava.prototype.type = "lava"

//lava act ignores keys object, takes a time step and the Level object as arguments
Lava.prototype.act = function(step,level){
  let newPos = this.pos.plus(this.speed.times(step))
  //if there's no onstacle, take the new position
  if (!level.obstacleAt(newPos, this.size))
    this.pos = newPos

  //if there's an obstace, one of two possibilities
  //case 1 - dripping lava object has repeatPos property ( back where you where) //stay in the same place
  else if (this.repeatPos)
    this.pos = this.repeatPos
    //case 2 - Bouncing lava inverts speed, so that it starts moving in the other direction
  else
    this.speed = this.speed.times(-1)
}

//Coins . they stay in one place with a slight wobble.

function Coin(pos){
  this.basePos = this.pos = pos.plus(new Vector(0.2,0.1))
  this.size = new Vector(0.6,0.6)
  //Randomized starting position of the coin (so that not all oscillate synchronously)
  this.wobble = Math.random() * Math.PI * 2
}
Coin.prototype.type = "coin"

//Coin act method handles wooble. Collisions with player will be handles in Player's act Method
Coin.prototype.act = function(step){
  this.wobble += step * wobbleSpeed
  //create a Wave
  let wobblePos = Math.sin(thisWobble) * wobbleDist
  this.pos = this.basePos.plus(new Vector(0, wobblePos))
}

  // let simpleLevel = new Level(simpleLevelPlan)
  // console.log(simpleLevel.width+ " by "+simpleLevel.height)


//Display will be done with display object

//Create element and give it a css class
function elt(name, className){
  let elt = document.createElement(name)
  if (className) elt.className = className
  return elt
}

//DOM display object constructor that takes a Level object and a parent to display
function DOMDisplay(parent, level){
  this.wrap = parent.appendChild(elt("div","game"))
  this.level = level
  //background never changes and its drawn once
  this.wrap.appendChild(this.drawBackground())
  //actor layer will be userd by drawFrame to keep track of the actors in the game so they can be removed and replaced
  this.actorLayer = null
  this.drawFrame()
}
 //scale is the number of pixels a single unit uses on the screen

 DOMDisplay.prototype.drawBackground = function(){
   //html table with background class for CSS
   let table = elt("table","background")
   //width according to scale
   table.style.width = this.level.width * scale + "px"

   this.level.grid.forEach(function(row){
     let rowElt = table.appendChild(elt("tr"))
     rowElt.style.height = scale + "px"
     row.forEach(function(type){
       //for each element on each row append a "td" element to the 'table' with a type class for CSS
       rowElt.appendChild(elt("td",type))
     })
   })
   return table
 }

 DOMDisplay.prototype.drawActors = function(){
   //wrapping html div of actors
   let wrap = elt("div")
   //add all actors in the level as a div in the wrap div
   this.level.actors.forEach((actor)=>{
     //addin two css classes to actor rect div
     let rect = wrap.appendChild(elt("div","actor "+actor.type))

     //styling of scale
     rect.style.width = actor.size.x *scale + "px"
     rect.style.height = actor.size.y *scale + "px"
     rect.style.left = actor.pos.x * scale + "px"
     rect.style.top = actor.pos.y * scale +"px"
   })
   return wrap
 }

 //Function to redraw actors. Since there are not many actors in this game, it's not expensive to
 //redraw them. Not redrwaing them would be more complex code as we would have to keep track.

 DOMDisplay.prototype.drawFrame = function(){
   if (this.actorLayer)
   //first remove actor layer
    this.wrap.removeChild(this.actorLayer)
    //redefin actorLayer with drawActor method
    this.actorLayer = this.wrap.appendChild(this.drawActor())
    //change class name depending on level status (condition of the player)
    this.wrap.className = "game" + (this.level.status || "")
    //method to scroll the View in case the level is protruding outside the viewport. Keeps the player centered
    this.scrollPlayerIntoView()
 }

 //In scroll Player into view method, we see the position of the player and scroll the view manipulating the
 //scrollLeft and scrollTop properties.

 DOMDisplay.scrollPlayerIntoView = function(){
   let width = this.wrap.clientWidth
   let height = this.wrap.clientHeight
   let margin = width/3

   //the viewport
   let left = this.wrap.scrollLeft, right = left + width
   let top = this.wrap.scrollTop, bottom = top + height

   let player = this.level.player
   //Defining center position
   //The center is defined by the player's position plus half its size, then scaled in pixels with times(scale)
   let center = player.pos.plus(player.size.times(0.5)).times(scale)

   //checks to see if the player's position is out of range. Negative values of scrollLeft will be made 0 by the DOM, so it doesn't matter
   if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width
    if (center.y < top + margin)
      this.wrap.scrollTop = center.y - margin
    else if (center.y > bottom - margin)
      this.wrap.scrollTop = center.y + margin - height
 }

 DOMDisplay.prototype.clear = function(){
   this.wrap.parentNode.removeChild(this.wrap)
 }

 //key tracking
function trackKeys(codes){
  let pressed = Object.create(null)
  function handler(event){
    if (codes.hasOwnProperty(event.keyCode)){
    let down = event.type == "keydown"
    pressed[codes[event.keyCode]] = down
    event.preventDefault()
    }
  }
  addEventListener("keydown", handler)
  addEventListener("keyup", handler)
  return pressed
}


//Animation
function runAnimation(frameFunc){
  let lastTime = null
  function frame(time){
    let stop = false
    if(lastTime != null){
      let timeStep = Math.min(time - lastTime, 100)/1000;
      stop = frameFunc(timeStep) === false
    }
    lastTime = time
    if (!stop)
      requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

//takes level, display constructir, and option andThen that calls the function with the level status
function runLevel(level, Display, andThen){
  let display = new Display(document.body, level)
  runAnimation(function(step){
    level.animate(step,arrows)
    display.drawFrame(step)
    if(level.isFinished()){
      display.clear()
      if(andThen)
        andThen(level.status)
      return false
    }
  })
}

//Sequence of levels
function runGame(plans, Display){
  function startLevel(n){
    runLevel(new Level(plans[n]), Display, function(status){
      if (status == "lost")
        startLevel(n)
      else if (n<plans.length -1)
        startLevel(n+1)
      else
        console.log("you win")
    })
  }
  startLevel(0)
}
