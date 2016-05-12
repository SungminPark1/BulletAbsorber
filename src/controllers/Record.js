var _ = require('underscore');
var models = require('../models');

var Record = models.Record;

var recordPage = function(req, res){
	Record.RecordModel.findByUser(req.session.account.username, function(err, docs){
		if(err){
			console.log(err);
			return res.status(400).json({error: "An error occurred"});
		}

		res.render('record', {record: docs});
	});
};

var addRecord = function(req, res){

	var recordData = {
		user: req.session.account.username,
		score: req.body.score
	};

	var newRecord = new Record.RecordModel(recordData);

	newRecord.save(function(err){
		if(err){
			console.log(err);
			return res.status(400).json({error:'An error occurred'});
		}
		console.log('successfully recored data');
	});
};

var highScorePage = function(req, res){

	var callback = function(err, docs) {
        if(err) {
            return res.json({err:err}); //if error, return it 
        }

        docs.sort(function(a,b){
        	return  b.score - a.score;
        });

        //return success
        if(req.session.account){	
        	return res.render('highscore', {csrfToken: req.csrfToken(), user: req.session.account.username, records: docs}); 
        }
        else{
        	return res.render('highscore', {csrfToken: req.csrfToken(), records: docs});
        }
    };

    findAllRecords(req, res, callback);
};

var findAllRecords = function(req, res, callback) {
	Record.RecordModel.find(callback);
};

module.exports.recordPage = recordPage;
module.exports.addRecord = addRecord;
module.exports.highScorePage = highScorePage;