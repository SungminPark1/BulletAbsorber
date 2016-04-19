"use strict";

(function(){
	var socket;
	var canvas;
	var ctx;

	var user = {};
	var highScore, currentScore;

	var room, started, isLobby;
	var players = {};
	var arrayBullets = [];
	var time;

	var updated = false;

	function init() {
		socket = io.connect();
		canvas = document.querySelector('canvas');
		ctx = canvas.getContext('2d');

		isLobby = true;
		started = false;

		setupUI();
		setupSocket();
		draw();
		//setInterval(draw, 1000/30);
		setInterval(update, 1000/30);
	}

	function setupUI(){
		user.name = document.querySelector('#user').innerHTML.substring(9);
		if(user.name == ''){
			user.name = "Guest " + Math.floor(Math.random()*1000);
		}
		else{
			document.querySelector('#highScore').innerHTML = highScore;
			document.querySelector('#currentScore').innerHTML = currentScore;
			document.querySelector('#score').value = highScore;
		}

		document.querySelector('#createRoom').onclick = function(e){
			//Create div with textbox/submit button to create room
			//current code for test
			var pos = {
				x: Math.random()*600+20,
				y: Math.random()*600+20,
			};

			var color = {
				r: 255,
				g: 0,
				b: 0
			};

			user.pos = pos;
			user.color = color;

			socket.emit('createRoom', {
				room: 'room1',
				player: {
					name: user.name,
					pos: pos,
					radius: 20,
					color: color,
					hit: 0,
					score: 0,
				}
			});
			console.log('clicked createRoom');
		};

		highScore = 0;
		currentScore = 0;
	}

	// sets up the socket
	function setupSocket(){
		socket.emit('join', {
			name: user.name
		});

		// updates player movements & bullets
		socket.on('update', function(data){
			players = data.players;
			arrayBullets = data.arrayBullets;
			draw();
		});

		// update data when players join game room
		socket.on('updateData', function(data){
			room = data.room;
			players = data.players;
			arrayBullets = arrayBullets;
			started = data.started;
			isLobby = false;
			console.log(players);
			draw();
		});
	}

	// update
	function update(){
		if(isLobby === false){
			var now = new Date().getTime(),
			//in seconds
				dt = (now - time)/1000;

			time = now;


			updated = false;

			if(myKeys.keydown[myKeys.KEYBOARD.KEY_W] == true){
				user.pos.y += -100 * dt;
				updated = true;
			}
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_A] == true){
				user.pos.x += -100 * dt;
				updated = true;
			}
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_S] == true){
				user.pos.y += 100 * dt;
				updated = true;
			}
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_D] == true){
				user.pos.x += 100 * dt;
				updated = true;
			}

			// prevent player from going out of bound
			user.pos.x = clamp(user.pos.x, 20, 620);
			user.pos.y = clamp(user.pos.y, 20, 620);

			// if this client's user moves, send to server to update other clients
			if(updated == true){
				socket.emit('updatePlayer', {
					name: user.name,
					pos: user.pos
				});
			}
		}
	}

	// draw other client's object
	function draw(){
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if(isLobby == true){
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			fillText(ctx, "Title", 640/2, 640/2 - 200, "50pt courier", "#ddd");

			fillText(ctx, "Control", 640/2, 640 - 130, "20pt courier", "#ddd");
			fillText(ctx, "atm only create room button does anything", 640/2, 640 - 100, "15pt courier", "#ddd");
			fillText(ctx, "use cursor to click buttons", 640/2, 640 - 75, "15pt courier", "#ddd");
			//fillText(ctx, "Arrow Keys or WASD to move", 640/2, 640 - 100, "15pt courier", "#ddd");
			//fillText(ctx, "Z or J to comfirm", 640/2, 640 - 75, "15pt courier", "#ddd");
			//fillText(ctx, "Shift or L to slow movement speed", 640/2, 640 - 50, "15pt courier", "#ddd");

		}
		else{
			if(started == true){
				var keys = Object.keys(players);

				for(var i = 0; i < keys.length; i++){
					var drawCall = players[ keys[i] ];
					if(drawCall.hit > 0){
						ctx.fillStyle = "rgb(" + (255 - drawCall.color.r) + ", " + (255 -drawCall.color.g) + ", " + (255 -drawCall.color.b) + ")";
					}	
					else{		
						ctx.fillStyle = "rgb(" + drawCall.color.r + ", " + drawCall.color.g + ", " + drawCall.color.b + ")";
					}
					ctx.beginPath();
					ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.radius, 0, Math.PI * 2, false);
					ctx.fill();
					ctx.stroke();
					ctx.closePath();
					if(drawCall.name == user.name){
						currentScore = drawCall.score;
						if(highScore < currentScore){
							highScore = currentScore;
						}
						document.querySelector('#highScore').innerHTML = 'High Score: ' + highScore;
						document.querySelector('#currentScore').innerHTML = 'Current Score: ' + currentScore;
						document.querySelector('#score').value = highScore;
					}
				}

				for(var i = 0; i<arrayBullets.length; i++){
					ctx.fillStyle = 'white';
					ctx.beginPath();
					ctx.arc(arrayBullets[i].pos.x, arrayBullets[i].pos.y, arrayBullets[i].radius, 0, Math.PI*2, false);
					ctx.fill();
					ctx.closePath();
				}
			}
			else{
				var keys = Object.keys(players);

				for(var i = 0; i < keys.length; i++){
					var drawCall = players[ keys[i] ];
					if(drawCall.hit > 0){
						ctx.fillStyle = "rgb(" + (255 - drawCall.color.r) + ", " + (255 -drawCall.color.g) + ", " + (255 -drawCall.color.b) + ")";
					}	
					else{		
						ctx.fillStyle = "rgb(" + drawCall.color.r + ", " + drawCall.color.g + ", " + drawCall.color.b + ")";
					}
					ctx.beginPath();
					ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.radius, 0, Math.PI * 2, false);
					ctx.fill();
					ctx.stroke();
					ctx.closePath();
				}

				document.querySelector('#createRoom').style.visibility = 'hidden';
				document.querySelector('#joinRoom').style.visibility = 'hidden';
				document.querySelector('#instructions').style.visibility = 'hidden';
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				fillText(ctx, room, 640/2, 640/2 - 200, "50pt courier", "#ddd");
				fillText(ctx, "WASD to move", 640/2, 640 - 100, "15pt courier", "#ddd");
			}
		}
	}

	// Utilities
	function clamp(val, min, max){
		return Math.max(min, Math.min(max, val));
	}

	function fillText(ctx, string, x, y, css, color) {
	ctx.save();
	// https://developer.mozilla.org/en-US/docs/Web/CSS/font
	ctx.font = css;
	ctx.fillStyle = color;
	ctx.fillText(string, x, y);
	ctx.restore();
}

	// Keyboard stuff
	var myKeys = {};
	myKeys.KEYBOARD = {
		"KEY_W": 87,
		"KEY_A": 65,
		"KEY_S": 83,
		"KEY_D": 68
	};

	myKeys.keydown = [];
	// event listeners
	window.addEventListener("keydown",function(e){
		myKeys.keydown[e.keyCode] = true;
	});
		
	window.addEventListener("keyup",function(e){
		myKeys.keydown[e.keyCode] = false;
	});

	window.onload = init;
	window.onunload = function(){
		socket.emit('disconnect');
	};
}());