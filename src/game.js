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
		enemiesKilled: 0,
		arrayBullets: [],
		time: new Date().getTime(),
		addPlayer: function(player){
			var color = {};
			if(Object.keys(this.players).length == 0){
				color.r = 255;
				color.g = 0;
				color.b = 0;
				this.players[player.name] = classes.createFighter(player.name, color);
			}
			else if(Object.keys(this.players).length == 1){
				color.r = 0;
				color.g = 255;
				color.b = 0;
				this.players[player.name] = classes.createBomber(player.name, color);
			}
			else if(Object.keys(this.players).length == 2){
				color.r = 0;
				color.g = 0;
				color.b = 255;
				this.players[player.name] = classes.createSupplier(player.name, color);
			}
			else{
				color.r = 255;
				color.g = 165;
				color.b = 0;
				this.players[player.name] = classes.createAura(player.name, color);
			}

		},
		deletePlayer: function(player){
			delete this.players[player];
			console.log(player + " deleted");
		},
		updatePlayers: function(player){
			this.players[player.name].pos = player.pos;
			this.players[player.name].skill1Used = player.skill1Used;
			this.players[player.name].skill2Used = player.skill2Used;

			
			if(player.damage != 0 && this.players[player.name].currentAttackRate <= 0){
				this.enemy.hp -= player.damage;
				this.players[player.name].currentAttackRate = this.players[player.name].attackRate;
			}
			
		},
		startGame: function(){

		},
		// kind of became the new update function......
		checkCollision: function(){
			var keys = Object.keys(this.players);

			for(var i = 0; i< keys.length; i++){
				var player = this.players[keys[i]];

				//skills!!!!!!!!!!!
				if(player.skill1Used === true){
					player.skill1(this.players, this.arrayBullets, this.enemy);
				}
				if(player.skill2Used === true){
					player.skill2(this.players, this.arrayBullets, this.enemy);
				}

				for(var j = 0; j<this.arrayBullets.length; j++){
					// dont detect collisions if player is invulnerable
					if(player.hit <= 0 && player.alive === true){
						//check collision with graze radius
						if(circlesIntersect(player.pos, this.arrayBullets[j].pos) < (player.hitbox + player.grazeRadius + this.arrayBullets[j].radius)){

							//increase players energy and exp
							if(this.arrayBullets[j].absorbed === false){
								player.energy = Math.min((player.energy + 1), player.maxEnergy);
								player.currentExp++;
								this.arrayBullets[j].absorbed = true;
							}

							// check if player levels up
							if(player.currentExp >= player.exp) player.levelUp();

							// check collision with player hitbox
							if(circlesIntersect(player.pos, this.arrayBullets[j].pos) < (player.hitbox + this.arrayBullets[j].radius) && this.arrayBullets[j].active === true){
								player.hp -= this.enemy.damage;
								player.hit = player.invul;
								player.energy = Math.round(player.energy*.75);
								this.arrayBullets[j].active = false;

								// check if player is dead
								if(player.hp <= 0){
									player.hp = 0;
									player.energy = 0;
									player.currentExp = Math.round(player.currentExp * 0.5); //loss some exp
									player.alive = false;
									player.reviveTime += 600; // increase the revive timer by 10 sec
									player.reviveTimer = player.reviveTime; // dead however long their relive time is
								}

							} // end if in hitbox
						} // end if in graze			
					} // end if hit / alive
				} // end for loop

				// charge basic attack
				
				if(player.hit <= 0 && player.alive === true){
					if(player.currentAttackRate > 0){
						player.currentAttackRate--;
					}
					else{
						player.currentAttackRate = 0;
					}
				}
				
				player.hit--;
				player.reviveTimer--;

				if(player.alive === false && player.reviveTimer <= 0){
					player.hp = player.maxHp;
					player.alive = true;
				}
			}
		},
		update: function(){
			var now = new Date().getTime();

			// in seconds
			var dt = (now - this.time) / 1000;
			this.time = now;
			// CHANGE TO FALSE ONCE GAME LOBBY IS MADE
			if(this.started === true){

			}
			else{
				if(!this.enemy){
					this.enemy = enemies.createEnemy(1,1, 1);
					this.enemy.attackPattern = Math.floor(Math.random()*3);
				}
				// if enemy is dead
				else if(this.enemy.hp <= 0){
					this.enemiesKilled++;

					var keys = Object.keys(this.players);
					var enemyLevel = this.enemiesKilled;
					var playerNum = keys.length;


					for(var i = 0; i< keys.length; i++){
						var player = this.players[ keys[i] ];
						enemyLevel += player.level;
						player.currentExp += (player.exp * .25);
						player.hp = Math.min(player.hp + player.maxHp *.2, player.maxHp);

						// level up
						if(player.currentExp >= player.exp) player.levelUp();
					}
					// Scale enemy based on player's level
					this.enemy = enemies.createEnemy(1,enemyLevel, playerNum);
					this.enemy.attackPattern = Math.floor(Math.random()*3);
				}
				else{

					this.enemy.updateEnemy(dt);
					this.arrayBullets = this.enemy.arrayBullets;


					this.checkCollision();

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

function circlesIntersect(c1,c2){
	var dx = c2.x - c1.x;
	var dy = c2.y - c1.y;
	var distance = Math.sqrt(dx*dx + dy*dy);
	return distance;
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