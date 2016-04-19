var game = require('./game.js');

var gameRooms = {};

var onJoined = function(socket, io) {
	socket.on('join', function(data){
		socket.join('lobby');
		socket.room = 'lobby';
		socket.name = data.name;
	});

	socket.on('createRoom', function(data){
		socket.leave('lobby');
		socket.join(data.room);
		socket.room = data.room;
		gameRooms[data.room] = game;
		gameRooms[data.room].createRoom(socket, data, io);
	});

	socket.on('joinRoom', function(data, io){
		if(gameRooms[data.room] !== null){
			socket.room = data.room;
			gameRooms[data.room].addPlayer(data);
		}
		else{
			// send error message
			console.log(data.roomName + ' does not exist');
		}
	});
};

var onMsg = function(socket, io) {
	socket.on('changeReady', function(data){

	});

	socket.on('updatePlayer', function(data){
		gameRooms[socket.room].updatePlayers(data, io);
	});
};

var onDisconnect = function(socket, io) {
	socket.on('disconnect', function(){
		// find the disconnected players room and deleted the player
		if(socket.room != 'lobby'){
			var keys = Object.keys(gameRooms);

			for(var i = 0; i < keys.length; i++){
				var room = gameRooms[keys[i]];

				if(room = socket.room){
					gameRooms[room].deletePlayer(socket.name, io);
				}
			}
		}
	});
};

module.exports.onJoined = onJoined;
module.exports.onMsg = onMsg;
module.exports.onDisconnect = onDisconnect;