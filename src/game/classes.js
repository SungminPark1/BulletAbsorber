var createFighter = function(name, color) {
	var fighter = {
		name: name,
		pos: {
			x: 200,
			y: 200,
		},
		color: color,
		alive: true,

		reviveTimer: 0,
		reviveTime: 1200,

		hp: 10,
		maxHp: 10,
		hpCap: 100,

		energy: 0,
		maxEnergy: 10,
		energyCap: 100,

		hitbox: 20,
		hitboxCap: 5,

		grazeRadius: 15,
		grazeRadiusCap: 30,

		currentAttackRate: 500,
		attackRate: 500,
		attackRateCap: 100,

		maxDamage: 10,
		maxDamageCap: 100,

		minDamage: 5,
		minDamageCap: 50,

		speed: 100,
		speedCap: 200,

		hit: 0,
		invul: 30,
		invulCap: 120,

		currentExp: 0,
		exp: 10,

		skill1Used: false,
		skill1: function(players, arrayBullet, enemy){
			var keys = Object.keys(players);

			for(var i = 0; i< keys.length; i++){
				players[keys[i]].hp = players[keys[i]].maxHp;
			}

			this.skill1Used = false;
		},

		skill2Used: false,
		skill2: function(players, arrayBullet, enemy){

			this.skill2Used = false;
		},

		levelUp: function(){
			this.maxHp = Math.min((this.maxHp + 2), this.hpCap);
			this.hp = this.maxHp;

			this.maxEnergy = Math.min((this.maxEnergy + 1), this.energyCap);

			this.hitbox = Math.max((this.hitbox - .5), this.hitboxCap);

			this.grazeRadius = Math.min((this.grazeRadius + 1), this.grazeRadiusCap);

			this.attackRate = Math.max((this.attackRate), this.attackRateCap);

			this.maxDamage = Math.min((this.maxDamage + 3), this.maxDamageCap);

			this.minDamage = Math.min((this.minDamage + 2), this.minDamageCap);

			this.speed = Math.min((this.speed + 5), this.speedCap);

			this.invul = Math.min((this.invul +2), this.invulCap);

			this.currentExp = 0;
			this.exp += 10;
		}
	};

	return fighter;
};

module.exports.createFighter = createFighter;
//module.exports.createAbsorber = createAbsorber;
//module.exports.createAura = createAura;
//module.exports.createChampion = createChampion;
