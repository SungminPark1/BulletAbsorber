//import libraries
var path = require('path');
var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var url = require('url');
var csrf = require('csurf');
var socketio = require('socket.io');
var ioSockets = require('./ioSockets.js');

var dbURL = process.env.MONGODB_URI || "mongodb://localhost/BulletAbsorber";

var db = mongoose.connect(dbURL, function(err){
	if(err){
		console.log("Could not connect to database");
		throw err;
	}
});

var redisURL = {
	hostname: 'localhost',
	port: 6379
};

var redisPASS;

if(process.env.REDISCLOUD_URL){
	redisURL = url.parse(process.env.REDISCLOUD_URL);
	redisPASS = redisURL.auth.split(":")[1];
}

// pull in our routes
var router = require('./router.js');
var port = process.env.PORT || process.env.NODE_PORT || 3000;

var app = express();
app.use('/assets', express.static(path.resolve(__dirname + '/../client/')));
app.use(compression());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({
	key: "sessionid",
	store: new RedisStore({
		host: redisURL.hostname,
		port: redisURL.port,
		pass: redisPASS
	}),
	secret: 'Random Word',
	resave: true,
	saveUninitialized: true,
	cookie:{
		httpOnly: true
	}
}));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(favicon(__dirname + '/../client/img/favicon.png'));
app.disable('x-powered-by');
app.use(cookieParser());


// csrf must come AFTER app.use(cookieParser());
// and app.use(session({.....}));
// should come BEFORE the router
app.use(csrf());
app.use(function(err, req, res, next){
	if(err.code !== 'EBADCSRFTOKEN') return next(err);

	return;
});

router(app);

var server = require('http').createServer(app);
var io = socketio(server);

io.sockets.on("connection", function(socket) {
	ioSockets.onJoined(socket, io);
	ioSockets.onMsg(socket, io);
	ioSockets.onDisconnect(socket, io);
});

server.listen(port, function(err){
	if(err){
		throw err;
	}
	console.log('Listen on port ' + port);
});

console.log('websocket server started');
