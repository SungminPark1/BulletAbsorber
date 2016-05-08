var bullet = require('./bullet.js'); 
var victor = require('victor');

var createEnemy = function(type, level){
	var enemy;

	if(type == 1){
		enemy = {
			name: "Sprayer",
			hp: 50*level,
			maxHp: 50*level,
			damage: Math.round(level/2),
			difficulty: level,
			arrayBullets: [],

			attackPattern: 0,
			currentAttackDur: 0,
			attackDur: 300 + 30*level,

			currentRestDur: 0,
			restDur: 30,

			attack1: function(dt){
				for(var i = 0; i<this.arrayBullets.length; i++){
					this.arrayBullets[i].update(dt);
				}

				var vec = victor(Math.random() *2 - 1, Math.random() * 2 - 1);
				var radius = 9.5 + (this.difficulty *.5);
				var spawnRate = Math.round(10.5 - (this.difficulty * .5));

				if(radius >= 20){
					radius = 20;
				}

				if(spawnRate <= 2){
					spawnRate = 2;
				}

				if(this.currentAttackDur%spawnRate == 0){
					this.arrayBullets.push(bullet.create(320, 50, radius, vec.x * 100, vec.y * 100, "#FFFFFF"));
				}
				this.currentAttackDur--;
			},
			attack2: function(dt){

				this.currentAttackDur--;
			},
			attack3: function(dt){

				this.currentAttackDur--;
			}
		};
	}

	return enemy;
}

module.exports.createEnemy = createEnemy;