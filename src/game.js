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
		dt: 0,
		addPlayer: function(player){
			var color = {};
			color.r = 255;
			color.g = 0;
			color.b = 0;
			this.players[player.name] = classes.createFighter(player.name, color);
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
			var keys = Object.keys(this.players);
			for(var i = 0; i< keys.length; i++){
				var color = {};
				var player = this.players[ keys[i] ];
				if(i == 0){
					color.r = 255;
					color.g = 0;
					color.b = 0;
				}
				else if ( i == 1){
					color.r = 0;
					color.g = 255;
					color.b = 0;
				}
				else if ( i == 2){
					color.r = 0;
					color.g = 250;
					color.b = 255;
				}
				else{
					color.r = 255;
					color.g = 165;
					color.b = 0;
				}

				if(player.type == 0){
					this.players[player.name] = classes.createFighter(player.name, 85 + i*159 , 400 , color);
				}
				else if(player.type == 1){
					this.players[player.name] = classes.createBomber(player.name, 85 + i*159 , 400 , color);
				}
				else if(player.type == 2){
					this.players[player.name] = classes.createSupplier(player.name, 85 + i*159 , 400 , color);
				}
				else{
					this.players[player.name] = classes.createAura(player.name, 85 + i*159 , 400 ,color);
				}
			}

			this.enemy = enemies.createEnemy(1,1, 1);
			this.enemy.attackPattern = Math.floor(Math.random()*3);

			this.started = true;
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
			this.dt = (now - this.time) / 1000;

			this.time = now;
			// CHANGE TO FALSE ONCE GAME LOBBY IS MADE
			if(this.started === true){
				// if enemy is dead
				if(this.enemy.hp <= 0){
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

					this.enemy.updateEnemy(this.dt);
					this.arrayBullets = this.enemy.arrayBullets;


					this.checkCollision();

					// remove bullets that are out of bound
					this.arrayBullets = this.arrayBullets.filter(function(bullet){
						return bullet.active;
					});
				}
			}
			else{
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