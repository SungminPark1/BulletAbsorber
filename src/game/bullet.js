var victor = require('victor');

function create(x, y, radius, speedx, speedy, color){
	var bullet = {
		pos: new victor(x,y),
		velocity: new victor(speedx, speedy),
		radius: radius,
		absorbed: false,
		active: true,
		update: function(dt){
			this.pos.x += this.velocity.x * dt;
			this.pos.y += this.velocity.y * dt;
			this.active = this.active && this.inBounds(this.pos.x, this.pos.y);
		},
		inBounds: function(x,y){
			if(x <= -50 || x > 690 || y <= -50 || y > 690){
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