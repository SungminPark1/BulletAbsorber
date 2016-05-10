var bullet = require('./bullet.js'); 
var victor = require('victor');

var createEnemy = function(type, level, playerNum){
	var enemy;

	if(type == 1){
		enemy = {
			name: "Sprayer",
			hp: 25 + 25 * level,
			maxHp: 25 + 25 * level,
			damage: level/playerNum/2,
			difficulty: level/playerNum,
			arrayBullets: [],

			attackPattern: 0,
			currentAttackDur: 300 + 30*level,
			attackDur: 300 + 30*level,

			currentRestDur: 300,
			restDur: 300,
			lastRotation: 0,
			updateEnemy: function(dt){
				for(var i = 0; i<this.arrayBullets.length; i++){
					this.arrayBullets[i].update(dt);
				}

				if(this.currentRestDur <= 0){
					var spawnRate = Math.round(10.5 - (this.difficulty * .5));
					if(radius >= 20){
						radius = 20;
					}
					if(spawnRate <= 2){
						spawnRate = 2;
					}

					if(this.attackPattern == 0){
						var radius = 9.5 + (this.difficulty *.5);
						if(this.currentAttackDur%spawnRate == 0){
							var vec = victor(Math.random() *2 - 1, Math.random() * 2 - 1);
							this.arrayBullets.push(bullet.create(320, 50, radius, vec.x * 100, vec.y * 100, "#FFFFFF"));
						}
					}
					else if(this.attackPattern == 1){
						var radius = Math.min(9.5 + (this.difficulty *.5), 15);
						if(this.currentAttackDur == this.attackDur){
							var vec = victor(Math.random() * 2 - 1, Math.random() * 2 - 1);
							vec.normalize();
							this.lastRotation = vec;
							this.arrayBullets.push(bullet.create(320, 50, radius, vec.x * 100, vec.y * 100, "#FFFFFF"));
						}

						if(this.currentAttackDur%2 == 0){
							var vec = this.lastRotation;
							vec.rotate(Math.PI/(10 + (Math.random() *3)));
							this.lastRotation = vec;

							this.arrayBullets.push(bullet.create(320, 50, 10, vec.x * 100, vec.y * 100, "#FFFFFF"));
						}

						if(this.currentAttackDur%(spawnRate) == 0){
							this.arrayBullets.push(bullet.create(320, 50, radius, (Math.random() *2 - 1) * 100, Math.random() * 100, "#FFFFFF"));
						}

					}	
					else if (this.attackPattern == 2){
						var radius = Math.min(9.5 + (this.difficulty * .5), 20);
						if(this.currentAttackDur%(spawnRate*5) == 0){
							this.arrayBullets.push(bullet.create(320, 50, radius, (Math.random()* .5 - 1) * 100, 100, "#FFFFFF"));
							this.arrayBullets.push(bullet.create(320, 50, radius, (Math.random() - .5) * 100, 100, "#FFFFFF"));
							this.arrayBullets.push(bullet.create(320, 50, radius, (Math.random()* .5 + .5) * 100, 100, "#FFFFFF"));
						}
					}

					this.currentAttackDur--;

					// change attack pattern and let the enemy rest for a short duration
					if(this.currentAttackDur <= 0){
						this.currentAttackDur = this.attackDur;
						this.currentRestDur = this.restDur;
						this.attackPattern = Math.floor(Math.random()*3);
						//console.log(this.attackPattern);
					}
				}
				else{
					this.currentRestDur--;
				}
			},

		};
	}

	return enemy;
}

module.exports.createEnemy = createEnemy;