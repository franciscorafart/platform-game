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

//Object to read the level
function Level(plan){
  this.width = plan[0].length
  this.height = plan.length
  //grid array will contain line arrays
  this.grid = []
  this.actor = []

  for (let y = 0; y< this.height ; y++){
    let line = plan[y], gridLine = []

    for(let x = 0; x<this.width; x++){
      //character in coordinate a fieldType that will be forst null, in case the car represents and actor in the game
      let ch = line[x], fieldType = null;
      //extract which actor is the character in the coordinate
      let Actor = actorChars[ch]
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
  this.player = this.actor.filter(function(actor){
    return actor.type == 'player'
  })[0]
  this.status = this.finishDelay = null
}
