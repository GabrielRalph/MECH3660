var list = ['a1parta'];
var html = ''

for(var i in list){
  html += `<h1 onclick = "window.open('${list[i]}/')">${list[i]}</h1>\n`
}
document.getElementById('app').innerHTML += html
