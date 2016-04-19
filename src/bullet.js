var victor = require('victor');

function create(x, y, radius, speedx, speedy, color){
	bullet = {
		pos: new victor(x,y),
		velocity: new victor(speedx, speedy),
		radius: radius,
		active: true,
		update: function(dt){
			this.pos.x += this.velocity.x * dt;
			this.pos.y += this.velocity.y * dt;
			this.active = this.active && this.inBounds(this.pos.x, this.pos.y);
		},
		inBounds: function(x,y){
			if(x <= -100 || x > 740 || y <= -100 || y > 740){
				return false;
			}
			else{
				return true;
			}
		}
	};

	return bullet;
}

module.exports = {
	create: create
};