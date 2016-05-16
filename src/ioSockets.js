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
				enemy: gameRooms[socket.room].enemy,
				players: gameRooms[socket.room].players,
				arrayBullets: gameRooms[socket.room].arrayBullets,
				started: gameRooms[socket.room].started
			});
		}
		else{
			socket.emit('roomError', {
				msg: 'Room: ' + data.room + ' already exisits.'
			})
		}
	});

	socket.on('joinRoom', function(data, io){
		if(gameRooms[data.room]){
			if(Object.keys(gameRooms[data.room].players).length < 4 && gameRooms[data.room].started === false){
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
				socket.emit('roomError', {
					msg: 'Room: ' + data.room + ' is full or already started the game.'
				});
			}
		}
		else{
			// send error message
			socket.emit('roomError', {
				msg: 'Room: ' + data.room + ' does not exist.'
			});
		}
	});

	socket.on('updatePlayer', function(data){
		gameRooms[socket.room].updatePlayers(data);
	});

	socket.on('updateGameLobby', function(data){
		gameRooms[socket.room].players[socket.name].type = data.type;
		gameRooms[socket.room].players[socket.name].ready = data.ready;

		var numReady = 0;
		var starting = false;
		var keys = Object.keys(gameRooms[socket.room].players);
		for(var i = 0; i< keys.length; i++){
			if(gameRooms[socket.room].players[keys[i]].ready === true){
				numReady++;
			}
		}

		if(numReady == keys.length){
			gameRooms[socket.room].startGame();
			starting = true;

			io.sockets.in(socket.room).emit('starting', {
				start: starting,
				players: gameRooms[socket.room].players
			});
		}
	});

	updateRoom = function(room){
		gameRooms[room].update();

		if(gameRooms[room].started === true){
			io.sockets.in(room).emit('updateGame', {
				players: gameRooms[room].players,
				arrayBullets: gameRooms[room].arrayBullets,
				dt: gameRooms[room].dt,
				enemyHp: gameRooms[room].enemy.hp,
				enemyMaxHp: gameRooms[room].enemy.maxHp,
				enemyDamage: gameRooms[room].enemy.damage,
				enemyName: gameRooms[room].enemy.name,
				enemyCurrentAttackDur:gameRooms[room].enemy.currentAttackDur,
				enemyAttackDur:gameRooms[room].enemy.attackDur,
				enemyCurrentRestDur:gameRooms[room].enemy.currentRestDur,
				enemyRestDur:gameRooms[room].enemy.restDur
			});
		}
		else{
			io.sockets.in(room).emit('updateGameLobby', {
				players: gameRooms[room].players,
			});
		}

		if(gameRooms[room].ended === true){
			io.sockets.in(room).emit('gameEnded', {
				players: gameRooms[room].players,
				enemiesKilled: gameRooms[room].enemiesKilled,
				date: new Date()
			});

			//reset some values
			gameRooms[room].ended = false;
			gameRooms[room].enemiesKilled = 0;
		}
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