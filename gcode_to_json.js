
function getGCODE(ifram_id, table_id)
{
    // Get code from ifram with id provided in function paramter
    var iframe = document.getElementById(ifram_id);
    var code = iframe.contentDocument || iframe.contentWindow.document;
    code = code.getElementsByTagName('PRE')[0].innerHTML;

    var lines = code.split('\n')

    var json = []
    var lastPos = new Point(0,0,0);
    var lastFeed = 0;

    // Create html table
    var table = document.createElement("TABLE")

    for(var i in lines){

      // Create html row
      var row = document.createElement("TR")

      // Strip line of comments and store them
      var comments = ""
      var commands = lines[i].replace(/\(.*\)/g, (a) => {
        comments = a.replace(/\(|\)/g, '');
        return ''
      })

      // If comment exits create a hover hint with comment
      comments = comments?`<span class = "comment">${comments}</span>`:''

      //Remove line Numbers
      commands = commands.replace(/^N(\d)*/, '').replace(/^ /, '')

      // Create a row with the command, and the dimensions of the position
      row.innerHTML += `<td><h6>${commands}${comments}</h6></td><td><h5>w</h5></td><td><h5>l</h5></td><td><h5>f</h5></td>`
      table.appendChild(row)

      // Convert the gcode command into a json object
      var json_command = jsonCommand(commands, lastPos, lastFeed)
      lastPos = json_command.coord.assign()
      lastFeed = json_command.f

      // Add all information to a json object
      json.push({comments: comments, commands: json_command, row_el: row})
    }

    document.getElementById(table_id).appendChild(table)
    return json
}

let jsonCommand = (gcode_command, lastPos, lastFeed) => {
  // Break by spaces into commands
  gcode_command = gcode_command.split(' ')
  var json_command = {}

  // Create an object with the keys being the first char of the commands
  // and value's being the rest of the commands
  for(var i in gcode_command){
    json_command[gcode_command[i][0]] = gcode_command[i].substring(1)
  }

  // If either x, y, z, f, r is not set they will be set to the last position
  var x = json_command.X?parseFloat(json_command.X):lastPos.x;
  var y = json_command.Y?parseFloat(json_command.Y):lastPos.y;
  var z = json_command.Z?parseFloat(json_command.Z):lastPos.z;
  var f = json_command.F?parseFloat(json_command.F):lastFeed;
  var r = json_command.R?parseFloat(json_command.R):0;
  json_command = {g: json_command.G, coord: new Point(x, y, z), r: r, f: f}
  return json_command
}
