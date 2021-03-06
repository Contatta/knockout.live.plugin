var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , io = require('socket.io')
  , sys = require(process.binding('natives').util ? 'util' : 'sys')
  , server;

//node basic stuff
server = http.createServer(function(req, res){
  var path = url.parse(req.url).pathname;
  switch (path){
    case '/':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1>Welcome. Try the <a href="/chat.html">chat</a> example.</h1>');
      res.end();
      break;

    case '/json.js':
    case '/jquery.js':
    case '/knockout-latest.js':
    case '/knockout.live.plugin.js':
    case '/chat.html':
      fs.readFile(__dirname + path, function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'})
        res.write(data, 'utf8');
        res.end();
      });
      break;

    default: send404(res);
  }
}),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

server.listen(8080);

var io = io.listen(server)
  , clients = []
  , syncObjs = {knockoutObjects: {}};
//Be sure to send the message to everyone except the sender, otherwise we'll see recursion hell
io.sockets.on('connection', function(client){
  clients.push(client);
  // send all objects temporarily stored
  client.emit("message",syncObjs);

  client.on('message', function(message) {
    // append sync values to temporary storage
    // here you could block people trying to manually update via socket.send live readonly observables with named IDs
    syncObjs["knockoutObjects"][message.id] = message.value;
    for(var i=0,j=clients.length; i < j;i++ ) {
        if(clients[i].id !== client.id)
            clients[i].emit("message",message); 
    }
  });

  client.on('disconnect', function(){
    for(var i=0,j=clients.length; i < j;i++ ) {
        if(clients[i].id == client.id)
            clients.splice(i,1);
    }
  });
});

