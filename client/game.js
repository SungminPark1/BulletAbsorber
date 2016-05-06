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
		setInterval(update, 1000/60);
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
			//current code for test
			document.querySelector('#gameInfoBox').style.zIndex = 1;

			var divString = '<h1>Enter Room Name</h1>';
			divString += '<input id="roomName" type="text" placeholder="Room Name"></input>';
			divString += '<button id="submitCreateRoom">Create Room</button>';
			divString += '<button id="back">Back</button>';
			document.querySelector('#gameInfoBox').innerHTML = divString;


			//back to menu
			document.querySelector('#back').onclick = function(e){
				document.querySelector('#gameInfoBox').style.zIndex = -1;
			};

			// create the room
			document.querySelector('#submitCreateRoom').onclick = function(e){
				var roomName = document.querySelector('#roomName').value;
				if(roomName != ''){
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
						room: roomName,
						player: {
							name: user.name,
						}
					});
				}
				document.querySelector('#gameInfoBox').style.zIndex = -1;
			};			
		};

		document.querySelector('#joinRoom').onclick = function(e){
			document.querySelector('#gameInfoBox').style.zIndex = 1;

			var divString = '<h1>Enter Room Name</h1>';
			divString += '<input id="roomName" type="text" placeholder="Room Name"></input>';
			divString += '<button id="submitJoinRoom">Join Room</button>';
			divString += '<button id="back">Back</button>';
			document.querySelector('#gameInfoBox').innerHTML = divString;

			//back to menu
			document.querySelector('#back').onclick = function(e){
				document.querySelector('#gameInfoBox').style.zIndex = -1;
			};

			// create the room
			document.querySelector('#submitJoinRoom').onclick = function(e){
				var roomName = document.querySelector('#roomName').value;
				if(roomName != ''){
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

					
					socket.emit('joinRoom', {
						room: roomName,
						player: {
							name: user.name,
						}
					});
				}
				document.querySelector('#gameInfoBox').style.zIndex = -1;
			};	
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
			var keys = Object.keys(players);
			for(var i = 0; i < keys.length; i++){
				if(keys[i] == user.name) user = players[keys[i]];
			}
			draw();
		});

		// update data when players join game room
		socket.on('updateData', function(data){
			room = data.room;
			players = data.players;
			arrayBullets = arrayBullets;
			started = data.started;
			isLobby = false;
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
				user.pos.y += -user.speed * dt;
				updated = true;
			}
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_A] == true){
				user.pos.x += -user.speed * dt;
				updated = true;
			}
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_S] == true){
				user.pos.y += user.speed * dt;
				updated = true;
			}
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_D] == true){
				user.pos.x += user.speed * dt;
				updated = true;
			}

			// players can only use skills when alive
			if(user.alive === true){
				if(myKeys.keydown[myKeys.KEYBOARD.KEY_L] == true){
					user.skill1Used = true;
					updated = true;
				}
			}

			// prevent player from going out of bound
			user.pos.x = clamp(user.pos.x, 20, 620);
			user.pos.y = clamp(user.pos.y, 20, 490);

			// if this client's user moves, send to server to update other clients
			if(updated == true){
				socket.emit('updatePlayer', user);
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
			fillText(ctx, "Create a new room or join an existing room", 640/2, 640 - 100, "15pt courier", "#ddd");
			fillText(ctx, "Use cursor to click buttons", 640/2, 640 - 75, "15pt courier", "#ddd");
			//fillText(ctx, "Use cursor to click buttons", 640/2, 640 - 50, "15pt courier", "#ddd");
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
				ctx.fillStyle = "purple";
				ctx.fillRect(300,50,40,40);

				for(var i = 0; i<arrayBullets.length; i++){
					if(arrayBullets[i].absorbed == false) ctx.fillStyle = "white";
					else ctx.fillStyle = "gray";

					ctx.beginPath();
					ctx.arc(arrayBullets[i].pos.x, arrayBullets[i].pos.y, arrayBullets[i].radius, 0, Math.PI * 2, false);
					ctx.fill();
					ctx.closePath();
				}

				for(var i = 0; i < keys.length; i++){
					var drawCall = players[ keys[i] ];

					if(drawCall.alive === true){
						ctx.lineWidth= 2;
						// graze radius
						ctx.strokeStyle = 'white';
						ctx.beginPath();
						ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox + drawCall.grazeRadius, 0, Math.PI * 2, false);
						ctx.stroke();
						ctx.closePath();

						// hp bar
						ctx.strokeStyle = 'rgb(255,0,0)';
						ctx.beginPath();
						ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox + drawCall.grazeRadius, Math.PI/2, Math.PI * (drawCall.hp / drawCall.maxHp) + Math.PI/2, false);
						ctx.stroke();
						ctx.closePath();

						// energy bar
						ctx.strokeStyle = 'rgb(0,0,255)';
						ctx.beginPath();
						ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox + drawCall.grazeRadius, Math.PI/2, -Math.PI * (drawCall.energy / drawCall.maxEnergy) +  Math.PI/2, true);
						ctx.stroke();
						ctx.closePath();
					}

					// exp bar
					ctx.strokeStyle = 'rgb(255,255,0)';
					ctx.beginPath();
					ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox+1, Math.PI/2, Math.PI * (drawCall.currentExp / (drawCall.exp/2)) + Math.PI/2, false);
					ctx.stroke();
					ctx.closePath();

					// draw hitbox depending on player's state
					if(drawCall.alive === true){
						if(drawCall.hit > 0){
							ctx.fillStyle = "rgba(" + (drawCall.color.r) + ", " + (drawCall.color.g) + ", " + (drawCall.color.b) + ", .5)";
						}	
						else{		
							ctx.fillStyle = "rgb(" + drawCall.color.r + ", " + drawCall.color.g + ", " + drawCall.color.b + ")";
						}
					}
					else{
							ctx.fillStyle = "rgba(" + (drawCall.color.r) + ", " + (drawCall.color.g) + ", " + (drawCall.color.b) + ", .5)";

							// hp bar
							ctx.strokeStyle = 'rgb(255,255,255)';
							ctx.beginPath();
							ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox + drawCall.grazeRadius, Math.PI/2, Math.PI * ((3600 - drawCall.reviveTimer) / 1800) + Math.PI/2, false);
							ctx.stroke();
							ctx.closePath();
					}
					ctx.beginPath();
					ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox, 0, Math.PI * 2, false);
					ctx.fill();
					ctx.closePath();


					ctx.fillStyle = "rgba(0,0,0,.5)";
					ctx.strokeStyle = "white";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillRect(2+ i * 159,510, 159, 128);
					ctx.strokeRect(2+ i * 159,510, 159, 128);
					fillText(ctx, drawCall.name, 79 + i * 159 , 525, "15pt courier", "rgb(" + drawCall.color.r  +"," + drawCall.color.g + "," + drawCall.color.b + ")");
					fillText(ctx, "Damage: " + drawCall.minDamage + "~" + drawCall.maxDamage,  79 + i * 159 , 550, "12pt courier", "#ddd");
					ctx.strokeRect(30 + i*159, 575, 50, 50);
					ctx.strokeRect(80 + i*159, 575, 50, 50);
					fillText(ctx, "K", 55 + i * 159 , 600, "12pt courier", "#ddd");
					fillText(ctx, "L", 105 + i * 159 , 600, "12pt courier", "#ddd");
				}
				
				ctx.fillStyle = 'white';

				document.querySelector('#createRoom').style.visibility = 'hidden';
				document.querySelector('#joinRoom').style.visibility = 'hidden';
				document.querySelector('#instructions').style.visibility = 'hidden';
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				fillText(ctx, "Room: " + room, 50, 25, "10pt courier", "#ddd");
				fillText(ctx, "WASD to move", 640/2, 500, "15pt courier", "#ddd");
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
		"KEY_D": 68,
		"KEY_J": 74,
		"KEY_K": 75,
		"KEY_L": 76
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