var mongoose = require('mongoose');
var _ = require('underscore');

var RecordModel;

var RecordSchema = new mongoose.Schema({
	user: {
		type: String,
		required: true,
		ref: 'Account'
	},

	score: {
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

	return RecordModel.find(search).select("user score createdDate").exec(callback);
};

RecordModel = mongoose.model('Record', RecordSchema);

module.exports.RecordModel = RecordModel;
module.exports.RecordSchema = RecordSchema;

