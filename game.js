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

//Coins . they stay in one place with a slight wobble.

function Coin(pos){
  this.basePos = this.pos = pos.plus(new Vector(0.2,0.1))
  this.size = new Vector(0.6,0.6)
  //Randomized starting position of the coin (so that not all oscillate synchronously)
  this.wobble = Math.random() * Math.PI * 2
}
Coin.prototype.type = "coin"

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
