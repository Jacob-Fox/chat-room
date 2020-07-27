const fetch = require("node-fetch");
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const {  grandExchange } = require('osrs-api');

//get osrs item/id database giblet
fetch("https://www.osrsbox.com/osrsbox-db/items-summary.json").then(async function(response) {
  osrsDB = await response.json();
}).catch(function(e){
  console.log(e.message);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connect', (socket) => {
  io.to(socket.id).emit('user connected');
  socket.on('user connected response',function(name){
    io.emit('user connected message', {msg: name + " has connected", chatcount: getChatters()});
    var srvSockets=io.sockets.sockets;
  });
  socket.on('disconnect', () => {
    io.emit('user disconnected',getChatters());
  });
  socket.on('chat message', function(data) { //handle messages
    io.emit('chat message', data["name"] +": "+ data["msg"]);
  });
  socket.on('price check', function(itemname) { //needs to be data still to pass username
      getOSItemPrice(itemname).then(price => {io.emit('price check', {price: price, img: 'https://www.osrsbox.com/osrsbox-db/items-icons/'+getOSItemID(itemname)+'.png'})}).catch((e) => {
        console.error(e.message);
        io.emit('error message', "ERROR: Item \'" + itemname + "\' does not exist. ("+ e.message + ")" );
      });
  });
});

//get an OSRS items price using its name
async function getOSItemPrice(item){

  var itemID = getOSItemID(item);

  let ositem = await grandExchange.getItem(itemID).catch((e) => {
    console.error(e.message);
  });

    var ositemprice = ositem.item.current.price.toString();
    var nameAndPriceString = '';
    if(ositemprice.slice(-1) == 'm' || ositemprice.slice(-1) == 'k'){
	nameAndPriceString = ositem.item.name + ' costs ' + ositemprice;
	return(nameAndPriceString);
    }else{
        nameAndPriceString = ositem.item.name + ' costs ' + ositemprice + 'gp';
        return(nameAndPriceString);
    }
}

//get an osrs item's database id number 
function getOSItemID(item){
  item = item.toLowerCase();
  item = item.substring(0,1).toUpperCase() + item.substring(1);
  var x;
  
  for(x in osrsDB){
    if(osrsDB[x]["name"] == item){
	var itemID = osrsDB[x]["id"];
	break;
    }
  }
  
  return itemID; 
}


function getChatters(){
  var srvSockets=io.sockets.sockets;
  return Object.keys(srvSockets).length;
}


http.listen(3000, () => {
  console.log('listening on *:3000');
});
