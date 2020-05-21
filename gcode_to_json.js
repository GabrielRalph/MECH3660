
function getGCODE(file, callback)
{
    // var rawFile = new XMLHttpsRequest();
    // rawFile.open("GET", file, false);
    // rawFile.onreadystatechange = function ()
    // {
    //     if(rawFile.readyState === 4)
    //     {
    //         if(rawFile.status === 200 || rawFile.status == 0)
    //         {
    //             var allText = rawFile.responseText;
    //             gcodeToJson(allText, callback)
    //         }
    //     }
    // }
    // rawFile.send(null);
    var iframe = document.getElementById('code');
    var code = iframe.contentDocument || iframe.contentWindow.document;
    code = code.getElementsByTagName('PRE')[0].innerHTML;
    gcodeToJson(code, callback)
}
let gcodeToJson = (text, callback) => {
  var table = document.createElement("TABLE")
  var lines = text.split('\n')
  var json = []
  for(var i in lines){
    var row = document.createElement("TR")
    var comments = ""
    var commands = lines[i].replace(/\(.*\)/g, (a) => {
      comments = a.replace(/\(|\)/g, '');
      return ''
    })
    comments = comments?`<span class = "comment">${comments}</span>`:''
    row.innerHTML += `<td><h6>${commands}${comments}</h6></td><td><h5>w</h5></td><td><h5>l</h5></td><td><h5>f</h5></td>`
    table.appendChild(row)
    json.push({comments: comments, commands: commands, row_el: row})
  }
  document.getElementById('commands-table').appendChild(table)
  callback(json)
  return json
}
