var createFighter = function(name) {
	var fighter = {
		name: name,
		pos: {
			x: 200,
			y: 200,
		},
		color:{
			r: 255,
			g: 0,
			b: 0,
		},
		hp: 10,
		maxHp: 10,
		hpCap: 100,

		energy: 0,
		maxEnergy: 10,
		energyCap: 100,

		hitbox: 20,
		hitboxCap: 5,

		grazeRadius: 15,
		grazeRadiusCap: 50,

		currentAttackRate: 500,
		attackRate: 500,
		attackRateCap: 100,

		maxDamage: 10,
		maxDamageCap: 100,

		minDamage: 5,
		minDamageCap: 50,

		speed: 200,
		speedCap: 300,

		currentExp: 0,
		exp: 10,

		skill1: false,
		skill2: false,

		levelUp: function(){
			this.maxHp = Math.min((this.maxHp + 5), this.hpCap);

			this.maxEnergy = Math.min((this.maxEnergy + 5), this.energyCap);

			this.hitbox = Math.max((this.hitbox - 2), this.hitboxCap);

			this.grazeRadius = Math.min((this.grazeRadius + 2), this.grazeRadiusCap);

			this.maxDamage = Math.min((this.maxDamage + 3), this.maxDamageCap);

			this.minDamage = Math.min((this.minDamage +2), this.minDamageCap);

			this.speed = Math.min((this.speed + 10), this.speedCap);

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
