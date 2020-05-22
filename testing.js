var mycnc = new CNC_machine();
var svg = null;
var millBit = null;
window.addEventListener('load', () => {
  svg = document.getElementById('svgid')
  millBit = document.getElementById('millBit')
  var gcode = getGCODE('code', 'commands-table')
  lastRow = gcode[0].row_el;
  animateCommands(gcode)

})

var lastRow = ''

let animateCommands = (list) => {
  // If commands list is empty return
  if(list.length <= 1){
    return
  }

  // If the command is not movement related remove command from list and recurse
  if("00 01 02 03".indexOf(list[0].commands.g) == -1){
    list.shift()
    animateCommands(list)
    return
  }

  // Set visual elements at start
  lastRow.style.setProperty('background', 'transparent')
  var xyz = ['x', 'y', 'z']
  var wlf = lastRow.getElementsByTagName('H5');
  xyz.forEach((e, i) => {
    wlf[i].innerHTML = r2d(pos[e]);
  })
  lastRow = list[0].row_el
  lastRow.style.setProperty('background', 'yellow')
  lastRow.scrollIntoView({behavior: "smooth", block: "center"});

  feed = list[0].commands.f;
  // Get the steps as a string of x,s,y,h,z,d characters
  var steps = mycnc.G0(list.shift().commands);
  if(steps.mode.indexOf('rapid') != -1) feed = 500;

  // Create svg path element
  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  svg.appendChild(path)
  if(steps.mode.indexOf('rapid') == -1){
    path.setAttribute('stroke','red')
    path.setAttribute('stroke-width','10')
  }else{
    path.setAttribute('stroke','rgba(0,0,0,0.5)')
    path.setAttribute('stroke-width','0.5')
  }

  // Initiate the request animation from recursion
  window.requestAnimationFrame((timestamp) => {
    // For each frame animateSteps
    animateSteps(steps, path, timestamp, () => {
      // When all steps are animated, move to the next command and repeat
      animateCommands(list)
    })
  })
}



var speed = 5;
var feed = 0;
var stepcount = 0;
var pos = new Point()
var start = null;
var ogStart = null;
let animateSteps = (steps, pathObject, timestamp, callback) => {

  var stepsPerFrame = 10;
  if (!!start) {
    stepsPerFrame = ((timestamp - start)*(feed/60/1000/mycnc.step_distance.x));
  }else{
    ogStart = timestamp
  }
  start = timestamp;

  millis = Math.round((timestamp - ogStart)*speed);
  var seconds = Math.floor(millis/1000)
  millis -= seconds*1000;
  var minutes = Math.floor(seconds/60);
  seconds -= minutes*60;

  var timeString = `Run time: ${minutes<10?0:''}${minutes}:${seconds<10?0:''}${seconds}`
  document.getElementById('time').innerHTML = timeString;


  for(var i = 0; i < stepsPerFrame*speed; i++){
    stepcount++;
    document.getElementById('step-count').innerHTML = stepcount + " steps"
    var step = steps.steps[0];
    pos.x += (step == 'x') ? mycnc.step_distance.x : 0;
    pos.y += (step == 'y') ? mycnc.step_distance.y: 0;
    pos.x -= (step == 's') ? mycnc.step_distance.x : 0;
    pos.y -= (step == 'h') ? mycnc.step_distance.y: 0;
    pos.z += (step == 'z') ? mycnc.step_distance.z : 0;
    pos.z -= (step == 'd') ? mycnc.step_distance.z: 0;
    if(steps.steps.length < 1){
      callback()
      return
    }else{
      steps.steps = steps.steps.substring(1)
    }
  }
  var r = 5;
  millBit.setAttribute('rx', r)
  millBit.setAttribute('ry', r)

  millBit.setAttribute('cx', r3d(pos.x))
  millBit.setAttribute('cy', r3d(pos.y))

  var d = pathObject.getAttribute('d');

  if(!d){
    d = `M${r3d(pos.x)},${r3d(pos.y)}`
  }else{
    d += `L ${r3d(pos.x)},${r3d(pos.y)}`
  }
  pathObject.setAttribute('d',d)
  if(steps.mode.indexOf('rapid') == -1){
    var color = `rgba(255, ${200 + pos.z*3.5}, ${200 + pos.z*6}, 0.75)`;
    if(pos.z < -58) color = "rgb(200, 0, 0)"
    pathObject.setAttribute('stroke', color)
  }

  window.requestAnimationFrame((timestamp) => {
    animateSteps(steps, pathObject, timestamp, callback)
  });
}

let r3d = (num) => {return Math.round(num*1000)/1000}
let r2d = (num) => {return Math.round(num*100)/100}
