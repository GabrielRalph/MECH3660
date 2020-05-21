var list = ['a1_a'];
var html = ''

for(var i in list){
  html += `<h1 onclick = "window.open('mech3600.galetora.com/${list[i]}')">${list[i]}</h1>\n`
}
document.getElementById('app').innerHTML += html
