var bullet = require('./game/bullet.js'); 
var enemies = require('./game/enemies.js');
var classes = require('./game/classes.js');

// TO DO
// Grid for collisions 10x10 grid?

function createGame(data){
	var game = {
		room: data,
		started: false,
		players: {},
		enemy: null,
		arrayBullets: [],
		time: new Date().getTime(),
		addPlayer: function(player){
			this.players[player.name] = classes.createFighter(player.name);
		},
		deletePlayer: function(player){
			delete this.players[player];
			console.log(player + " deleted");
		},
		updatePlayers: function(player){
			this.players[player.name].pos = player.pos;
		},
		startGame: function(){

		},
		update: function(){
			var now = new Date().getTime();

			// in seconds
			var dt = (now - this.time) / 1000;
			this.time = now;
			// game lobby if false
			if(this.started === true){

			}
			else{
				if(!this.enemy){
					this.enemy = enemies.createEnemy(1,1);
				}
				else{
					this.enemy.attack1(dt);
					this.arrayBullets = this.enemy.arrayBullets;

					// remove bullets that are out of bound
					this.arrayBullets = this.arrayBullets.filter(function(bullet){
						return bullet.active;
					});
				}
			}
		}
	};

	return game;
}

module.exports = {
	createGame: createGame
};


/*
var room, started;
var players = {}; //holdes player object: *name, hp, energy, *pos, *color, *radius, *hit, *score, ready
var arrayBullets = [];
var time = new Date().getTime();

// create a new room
var createRoom = function(data, io){
	room = data.room;
	players[data.player.name] = data.player;
	started = false;

	// emit data back
	io.sockets.in(room).emit('updateData', {
		room: room,
		players: players,
		arrayBullets: arrayBullets,
		started: started
	});
};

// add a player to an existing room
var addPlayer = function(data , io){
	players[data.player.name] = data.player;

	// emit new room data back
	io.sockets.in(room).emit('updateData', {
		room: room,
		players: players,
		arrayBullets: arrayBullets,
		started: started
	});
};

var deletePlayer = function(name, io){
	delete players[name];

	// emit data back
	io.sockets.in(room).emit('updateData', {
		room: room,
		players: players,
		arrayBullets: arrayBullets,
		started: started
	});
};

var updatePlayers = function(data, io){
	players[data.name].pos = data.pos;

	// emit data back 
	// TEMP
	io.sockets.in(room).emit('update', {
		players: players,
		arrayBullets: arrayBullets
	});
};

var gameStarted = function(data){
	// TO DO
	// get a random enemy
	// set player/enemy base stats when all players are ready
	// set update interval
};

var update = function(){
	var keys = Object.keys(players);
	var now = new Date().getTime();

	// in seconds
	var dt = (now - time) / 1000;
	time = now;

	// update bullets
	for(var i = 0; i<arrayBullets.length; i++){
		arrayBullets[i].update(dt);
	}

	// update player
	for(var i = 0; i < keys.length; i++){
		var player = players[ keys[i] ];

		for(var j=0; j<arrayBullets.length; j++){
			// if a player hits a bullet
			var distance = circlesIntersect(player.pos, arrayBullets[j].pos);

			if(distance <= (player.radius + arrayBullets[j].radius)){
				player.hit = 200;
				arrayBullets[j].active = false;
				player.score = 0;
			}
			else if(player.hit > 0){
				player.hit--;
			}
			else{
				player.score++;
			}
		}
	}

	// remove bullets that are out of bound
	arrayBullets = arrayBullets.filter(function(bullet){
		return bullet.active;
	});

	// add new bullets if there are less the 20
	if (arrayBullets.length < 30){
		var num = 30 - arrayBullets.length;

		for(var i=0; i<num; i++){
			arrayBullets.push(bullet.create(getRandom(20, 480), -50, 10, getRandom(-1, 1) * 150, getRandom(0.5, 1) * 150));
		}
	}

	io.sockets.in(room).emit('update', {
		players: players,
		arrayBullets: arrayBullets
	});
};

//Utilties
function getRandom(min, max) {
  	return Math.random() * (max - min) + min;
}

function circlesIntersect(c1,c2){
	var dx = c2.x - c1.x;
	var dy = c2.y - c1.y;
	var distance = Math.sqrt(dx*dx + dy*dy);
	return distance;
}

module.exports.createRoom = createRoom;
module.exports.addPlayer = addPlayer;
module.exports.deletePlayer = deletePlayer;
module.exports.updatePlayers = updatePlayers;
module.exports.gameStarted = gameStarted;
module.exports.update = update;
*/