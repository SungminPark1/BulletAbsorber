var game = require('./game.js');

var gameRooms = {};

var onJoined = function(socket, io) {
	socket.on('join', function(data){
		socket.join('lobby');
		socket.room = 'lobby';
		socket.name = data.name;
	});
};

var onMsg = function(socket, io) {
	socket.on('createRoom', function(data){
		if(!gameRooms[data.room]){
			socket.leave('lobby');
			socket.join(data.room);
			socket.room = data.room;

			gameRooms[data.room] = game.createGame(data.room);
			gameRooms[data.room].addPlayer(data.player);
			gameRooms[data.room].interval = setInterval(function(){	updateRoom(data.room); }, 1000/60);
			// emit data back
			io.sockets.in(data.room).emit('updateData', {
				room: data.room,
				players: gameRooms[socket.room].players,
				arrayBullets: gameRooms[socket.room].arrayBullets,
				started: gameRooms[socket.room].started
			});
		}
		else{
			console.log('room already exists');
		}
	});

	socket.on('joinRoom', function(data, io){
		if(gameRooms[data.room]){
			socket.leave('lobby');
			socket.join(data.room);
			socket.room = data.room;

			gameRooms[data.room].addPlayer(data.player);


			socket.emit('updateData', {
				room: data.room,
				players: gameRooms[socket.room].players,
				enemy: gameRooms[socket.room].enemy,
				arrayBullets: gameRooms[socket.room].arrayBullets,
				started: gameRooms[socket.room].started
			});
		}
		else{
			// send error message
			console.log(data.roomName + ' does not exist');
		}
	});

	socket.on('changeReady', function(data){

	});

	socket.on('updatePlayer', function(data){
		gameRooms[socket.room].updatePlayers(data);
	});

	socket.on('attack', function(data){
		// make it into a game function so it can also detect if an enemy dies and can recreate the enemy?
		gameRooms[socket.room].enemy.hp -= data.damage;
		gameRooms[socket.room].players[socket.name].currentAttackRate = gameRooms[socket.room].players[socket.name].attackRate;

	});

	updateRoom = function(room){
		gameRooms[room].update();

		io.sockets.in(room).emit('update', {
			players: gameRooms[room].players,
			arrayBullets: gameRooms[room].arrayBullets,
			enemyHp: gameRooms[room].enemy.hp,
			enemyMaxHp: gameRooms[room].enemy.maxHp,
			enemyDamage: gameRooms[room].enemy.damage,
			enemyName: gameRooms[room].enemy.name
		});
	}
};

var onDisconnect = function(socket, io) {
	socket.on('disconnect', function(){
		// find the disconnected players room and deleted the player
		if(socket.room != 'lobby'){
			var keys = Object.keys(gameRooms); //get the keys of the game rooms

			for(var i = 0; i < keys.length; i++){
				var game = gameRooms[keys[i]];

				// check if the game's room matches the socket's room
				if(game.room == socket.room){
					gameRooms[game.room].deletePlayer(socket.name);

					// deletes room if no players exist in it
					if(Object.keys(game.players) == 0){
						clearInterval(gameRooms[game.room].interval)
						delete gameRooms[keys[i]];
					}
				}
			}
		}
	});
};

module.exports.onJoined = onJoined;
module.exports.onMsg = onMsg;
module.exports.onDisconnect = onDisconnect;