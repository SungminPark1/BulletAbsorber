var mongoose = require('mongoose');
var _ = require('underscore');

var RecordModel;

var RecordSchema = new mongoose.Schema({
	user: {
		type: String,
		required: true,
		ref: 'Account'
	},

	type: {
		type: String,
		required: true,
		ref: 'Account'
	},

	level: {
		type: Number,
		min: 0,
		required: true
	},

	maxHp: {
		type: Number,
		min: 0,
		required: true
	},

	maxEnergy: {
		type: Number,
		min: 0,
		required: true
	},

	minDamage: {
		type: Number,
		min: 0,
		required: true
	},

	maxDamage: {
		type: Number,
		min: 0,
		required: true
	},

	deaths: {
		type: Number,
		min: 0,
		required: true
	},

	partySize: {
		type: Number,
		min: 0,
		required: true
	},

	partyLevel: {
		type: Number,
		min: 0,
		required: true
	},

	partyDeaths: {
		type: Number,
		min: 0,
		required: true
	},

	enemiesKilled: {
		type: Number,
		min: 0,
		required: true
	},

	createdDate:{
		type: Date,
		default: Date.now
	}
});

RecordSchema.statics.findByUser = function(user, callback){
	var search = {
		user: user
	};

	return RecordModel.find(search).select("user type level maxHp maxEnergy minDamage maxDamage deaths size partySize partyLevel partyDeaths enemiesKilled createdDate").exec(callback);
};

RecordModel = mongoose.model('Record', RecordSchema);

module.exports.RecordModel = RecordModel;
module.exports.RecordSchema = RecordSchema;

