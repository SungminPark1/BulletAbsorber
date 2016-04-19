var controllers = require('./controllers');
var mid = require('./middleware');

var router = function(app){
	app.get("/login", controllers.Account.gamePage);
	app.post("/login", controllers.Account.login);

	app.get("/signup", controllers.Account.signupPage);
	app.post("/signup", controllers.Account.signup);

	app.get("/logout", controllers.Account.logout);

	app.get("/record", controllers.Record.recordPage);
	app.post("/record", controllers.Record.addRecord);

	app.get("/highscore", controllers.Record.highScorePage);

	app.get("/", controllers.Account.gamePage);
};

module.exports = router;