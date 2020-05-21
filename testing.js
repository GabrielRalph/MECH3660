var mycnc = new CNC_machine();
var svg = null;
var millBit = null;
window.addEventListener('load', () => {
  svg = document.getElementById('svgid')
  millBit = document.getElementById('millBit')
  getGCODE('310275433.NC', (gcode) => {
    lastRow = gcode[0].row_el;
    animateCommands(gcode)
  })

})



var frameRate = 200
var lastRow = ''
let animateCommands = (list) => {
  if(list.length <= 1){
    return
  }
  if(list[0].commands.indexOf('G00 ') == -1&&list[0].commands.indexOf('G01 ') == -1&&list[0].commands.indexOf('G02 ') == -1&&list[0].commands.indexOf('G03 ') == -1){
    list.shift()
    animateCommands(list)
    return
  }
  lastRow.style.setProperty('background', 'transparent')
  var xyz = ['x', 'y', 'z']
  var wlf = lastRow.getElementsByTagName('H5');
  xyz.forEach((e, i) => {
    wlf[i].innerHTML = r2d(pos[e]);
  })
  lastRow = list[0].row_el
  lastRow.style.setProperty('background', 'yellow')
  lastRow.scrollIntoView({behavior: "smooth", block: "center"});
  var steps = mycnc.G0(list[0].commands)
    list.shift()
  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  svg.appendChild(path)
  if(steps.mode.indexOf('rapid') == -1){
    path.setAttribute('stroke','red')
    path.setAttribute('stroke-width','10')
  }else{
    path.setAttribute('stroke','rgba(0,0,0,0.5)')
    path.setAttribute('stroke-width','0.5')
  }
  path.setAttribute('fill','none')
  window.requestAnimationFrame(() => {
    animateSteps(steps, path, () => {
      animateCommands(list)
    })
  })
}
var stepcount = 0;
var pos = new Point()
let animateSteps = (steps, pathObject, callback) => {
  for(var i = 0; i < frameRate; i++){
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

  window.requestAnimationFrame(() => {
    animateSteps(steps, pathObject, callback)
  });
}

let r3d = (num) => {return Math.round(num*1000)/1000}
let r2d = (num) => {return Math.round(num*100)/100}
