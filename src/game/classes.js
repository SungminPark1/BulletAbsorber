/*	support = 13 stars + their special support stat
	others = 16 stars
	
	LEVEL UP STAT INCREASE RATES 
	Stat - 1 star, 2 star, 3 star
		Hp - 2, 4, 6
		Energy - 1, 2, 3
		Graze Radius - .5, 1, 1.5
		Attack Rate - 5, 15, 25
		Max Damage - 2, 4, 6
		Min Damage - 1, 2, 3
		Speed - 2.5, 5, 7.5
		Invul - 1, 2, 3

	Support Stats
		Supplier
			ExpGain - .025
			EnergyRegen - .02 (Allies only)

		Aura
			Healing - .025
			DoT(damage over time) - .1

*/

// Active skills = click to use once
// Sustained skill = click to toggle on/off

// Active Skill - Finisher (deals max damage - restore hp if it kills enemy), Final Strike (more energy = higher multiplier to max damage)
// To DO
// implement skill 1 and 2
var createFighter = function(name, color) {
	var fighter = {
		type: 'fighter',
		name: name,
		pos: {
			x: 200,
			y: 200,
		},
		color: color,
		alive: true,
		reviveTimer: 0,
		reviveTime: 1200,
		level: 1,

		hp: 10,
		maxHp: 10,

		energy: 0,
		maxEnergy: 20,
		energyCap: 50,

		hitbox: 25,
		hitboxCap: 12.5,

		grazeRadius: 15,
		grazeRadiusCap: 30,

		currentAttackRate: 600,
		attackRate: 600,
		attackRateCap: 60,

		maxDamage: 3,

		minDamage: 1,

		speed: 100,
		speedCap: 200,

		hit: 0,
		invul: 30,
		invulCap: 120,

		currentExp: 0,
		exp: 10,

		skill1Cost: 5,
		skill1Used: false,
		skill1: function(players, arrayBullets, enemy){
			if(this.energy < this.skill1Cost){
			}
			else{
				enemy.hp -= this.maxDamage;

				if(enemy.hp <= 0){
					this.hp = Math.min(this.hp + (this.maxHp*.1), this.maxHp);
				}

				this.energy -= this.skill1Cost;
			}

			this.skill1Used = false;
		},

		skill2Cost: 10,
		skill2Used: false,
		skill2: function(players, arrayBullets, enemy){
			if(this.energy < this.skill2Cost){
			}
			else{
				enemy.hp -= (this.maxDamage + (this.energy)) * (this.energy/5);

				this.energy = 0;
			}
			this.skill2Used = false;
		},

		levelUp: function(){
			// 16 / 24 stars
			this.level++;

			this.maxHp += 4; // 2 star
			this.hp += 4;

			this.maxEnergy = Math.min((this.maxEnergy + 1), this.energyCap); // 1 star

			this.hitbox = Math.max((this.hitbox - .5), this.hitboxCap); 

			this.grazeRadius = Math.min((this.grazeRadius + .5), this.grazeRadiusCap); // 1 star

			this.attackRate = Math.max((this.attackRate - 25), this.attackRateCap); // 3 star

			this.maxDamage += 6; // 3 star

			this.minDamage += 3; // 3 star

			this.speed = Math.min((this.speed + 5), this.speedCap); // 2 star

			this.invul = Math.min((this.invul + 1), this.invulCap); // 1 star

			this.currentExp = 0;
			this.exp += 10;
		}
	};

	return fighter;
};

// Active Skill - Focused Bomb (clear bullets in graze radius + deal damage), Barrier (more energy = larger bullet clearing radius)
var createBomber = function(name, color) {
	var bomber = {
		type: 'bomber',
 		name: name,
		pos: {
			x: 200,
			y: 200,
		},
		color: color,
		alive: true,
		reviveTimer: 0,
		reviveTime: 1200,
		level: 1,

		hp: 20,
		maxHp: 20,

		energy: 0,
		maxEnergy: 20,

		hitbox: 27.5,
		hitboxCap: 15,

		grazeRadius: 20,
		grazeRadiusCap: 50,

		currentAttackRate: 600,
		attackRate: 600,
		attackRateCap: 60,

		maxDamage: 3,

		minDamage: 1,

		speed: 75,
		speedCap: 200,

		hit: 0,
		invul: 30,
		invulCap: 120,

		currentExp: 0,
		exp: 10,

		skill1Cost: 10,
		skill1Used: false,
		skill1: function(players, arrayBullets, enemy){
			if(this.energy < this.skill1Cost){
				this.skill1Used = false;
			}
			else{
				for(var i = 0; i<arrayBullets.length; i++){
					if(circlesIntersect(this.pos, arrayBullets[i].pos) < (this.hitbox + this.grazeRadius + arrayBullets[i].radius)){
						arrayBullets[i].active = false;
					}
				}

				// remove bullets from array
				arrayBullets = arrayBullets.filter(function(bullet){
					return bullet.active;
				});

				enemy.hp -= this.maxDamage;

				this.energy -= this.skill1Cost;
				this.skill1Used = false;
			}
		},

		skill2Cost: 15,
		skill2Used: false,
		skill2: function(players, arrayBullets, enemy){
			if(this.energy < this.skill2Cost){
				this.skill2Used = false;
			}
			else{
				for(var i = 0; i<arrayBullets.length; i++){
					if(circlesIntersect(this.pos, arrayBullets[i].pos) < (this.hitbox + ( this.grazeRadius * ( this.energy/5 ) ) + arrayBullets[i].radius)){
						arrayBullets[i].active = false;
					}
				}

				// remove bullets from array
				arrayBullets = arrayBullets.filter(function(bullet){
					return bullet.active;
				});

				this.energy = 0;
				this.skill2Used = false;
			}
		},

		levelUp: function(){
			// 16 stars
			this.level++;

			this.maxHp += 6; // 3 star
			this.hp += 6;

			this.maxEnergy += 2; // 2 star

			this.hitbox = Math.max((this.hitbox - .5), this.hitboxCap); 

			this.grazeRadius = Math.min((this.grazeRadius + 1), this.grazeRadiusCap); // 2 star

			this.attackRate = Math.max((this.attackRate - 5), this.attackRateCap); // 1 star

			this.maxDamage += 4; // 2 star

			this.minDamage += 2; // 2 star

			this.speed = Math.min((this.speed + 2.5), this.speedCap); // 1 star

			this.invul = Math.min((this.invul + 3), this.invulCap); // 3 star

			this.currentExp = 0;
			this.exp += 10;
		}
	};

	return bomber;
};

// support class
// Sustained skills - ExpGain (convert energy to exp), EnergyRegen (give energy to allies)
var createSupplier = function(name, color) {
	var supplier = {
		type: 'supplier',
 		name: name,
		pos: {
			x: 200,
			y: 200,
		},
		color: color,
		alive: true,
		reviveTimer: 0,
		reviveTime: 1200,
		level: 1,

		hp: 10,
		maxHp: 10,

		energy: 0,
		maxEnergy: 20,

		hitbox: 22.5,
		hitboxCap: 10,

		grazeRadius: 15,
		grazeRadiusCap: 40,

		currentAttackRate: 600,
		attackRate: 600,
		attackRateCap: 60,

		maxDamage: 3,

		minDamage: 1,

		speed: 100,
		speedCap: 200,

		hit: 0,
		invul: 30,
		invulCap: 120,

		currentExp: 0,
		exp: 10,

		expGain: .02,
		expGainCap: .5,
		skill1Cost: 0,
		skill1Used: false,
		skill1: function(players, arrayBullets, enemy){
			if(this.energy <= 0){
				this.skill1Used = false;
				this.energy = 0;
			}
			else{
				var keys = Object.keys(players);

				for(var i = 0; i< keys.length; i++){
					players[keys[i]].currentExp += this.expGain;

					if(players[keys[i]].currentExp >= players[keys[i]].exp){
						players[keys[i]].levelUp();
					}
				}

				this.energy -= .1;
			}	
		},

		energyRegen: .02,
		energyRegenCap: .5,
		skill2Cost: 0,
		skill2Used: false,
		skill2: function(players, arrayBullets, enemy){
			if(this.energy <= 0){
				this.skill2Used = false;
				this.energy = 0;
			}
			else{
				var keys = Object.keys(players);

				for(var i = 0; i< keys.length; i++){
					if(keys[i] != this.name){
						players[keys[i]].energy = Math.min((players[keys[i]].energy + this.energyRegen), players[keys[i]].maxEnergy);
					}
				}

				this.energy -= .1;
			}
		},

		levelUp: function(){
			// 13 stars
			this.level++;

			this.maxHp += 2; // 1 star
			this.hp += 2;

			this.maxEnergy += 1; // 1 star

			this.hitbox = Math.max((this.hitbox - .5), this.hitboxCap); 

			this.grazeRadius = Math.min((this.grazeRadius + 1.5), this.grazeRadiusCap); //3 star

			this.attackRate = Math.max((this.attackRate - 5), this.attackRateCap); // 1 star

			this.maxDamage += 4; // 2 star

			this.minDamage += 1; // 1 star

			this.speed = Math.min((this.speed + 7.5), this.speedCap); // 3 star

			this.invul = Math.min((this.invul + 1), this.invulCap); // 1 star

			this.expGain =  Math.min((this.expGain + .01), this.expGainCap);

			this.energyRegen =  Math.min((this.energyRegen + .02), this.energyRegenCap);

			this.currentExp = 0;
			this.exp += 10;
		}
	};

	return supplier;
};

// support class
// Sustained skills - HpRegen (convert energy to hp), DamageField (convert energy to damage)
var createAura = function(name, color) {
	var aura = {
		type: 'aura',
 		name: name,
		pos: {
			x: 200,
			y: 200,
		},
		color: color,
		alive: true,
		reviveTimer: 0,
		reviveTime: 1200,
		level: 1,

		hp: 10,
		maxHp: 10,

		energy: 0,
		maxEnergy: 20,

		hitbox: 22.5,
		hitboxCap: 10,

		grazeRadius: 13,
		grazeRadiusCap: 30,

		currentAttackRate: 600,
		attackRate: 600,
		attackRateCap: 60,

		maxDamage: 3,

		minDamage: 1,

		speed: 75,
		speedCap: 200,

		hit: 0,
		invul: 30,
		invulCap: 120,

		currentExp: 0,
		exp: 10,

		hpRegen: .02,
		hpRegenCap: .5,
		skill1Cost: 0,
		skill1Used: false,
		skill1: function(players, arrayBullets, enemy){
			if(this.energy <= 0){
				this.skill1Used = false;
				this.energy = 0;
			}
			else{
				var keys = Object.keys(players);

				for(var i = 0; i< keys.length; i++){
					players[keys[i]].hp = Math.min((players[keys[i]].hp + this.hpRegen), players[keys[i]].maxHp);
				}

				this.energy -= .1;
			}
		},
		damageOverTime: .1,
		skill2Cost: 0,
		skill2Used: false,
		skill2: function(players, arrayBullets, enemy){
			if(this.energy <= 0){
				this.skill2Used = false;
				this.energy = 0;
			}
			else{
				enemy.hp -= this.damageOverTime;
				this.energy -= .1;
			}
		},

		levelUp: function(){
			// 14 / 24 stars
			this.level++;

			this.maxHp += 2; // 1 star
			this.hp += 2;

			this.maxEnergy += 3; // 3 star

			this.hitbox = Math.max((this.hitbox - .5), this.hitboxCap); //.5

			this.grazeRadius = Math.min((this.grazeRadius + 1.5), this.grazeRadiusCap); // 3 star

			this.attackRate = Math.max((this.attackRate - 5), this.attackRateCap); // 1 star

			this.maxDamage += 2; // 1 star

			this.minDamage += 1; // 1 star

			this.speed = Math.min((this.speed + 5), this.speedCap); // 2 star

			this.invul = Math.min((this.invul + 2), this.invulCap); // 2 star

			this.hpRegen = Math.min((this.hpRegen + .01), this.hpRegenCap);

			this.damageOverTime += .1;

			this.currentExp = 0;
			this.exp += 10;
		}
	};

	return aura;
};

function circlesIntersect(c1,c2){
	var dx = c2.x - c1.x;
	var dy = c2.y - c1.y;
	var distance = Math.sqrt(dx*dx + dy*dy);
	return distance;
}

module.exports.createFighter = createFighter;
module.exports.createBomber = createBomber;
module.exports.createSupplier = createSupplier;
module.exports.createAura = createAura;
