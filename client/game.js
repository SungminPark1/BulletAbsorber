"use strict";

(function(){
	var socket;
	var canvas;
	var ctx;

	var user = {};

	var hasAccount = false;
	var sessionRecord = {};

	var room, started, isLobby;
	var players = {};
	var attackCircles = [];
	var enemy = {};
	var arrayBullets = [];

	var damage = false;
	var updated = false;
	var viewControls = true;
	var previousSkillButtonDown = false;
	var playerType = 0;
	var _csrf;
	function init() {
		socket = io.connect();
		canvas = document.querySelector('canvas');
		ctx = canvas.getContext('2d');

		isLobby = true;
		started = false;

		// make attack circles
		for(var i = 0; i < 3; i++){
			var temp = {
				pos: {
					x: 320,
					y: 320
				},
				velocity: getRandomUnitVector(),
				radius: 40
			}
			attackCircles.push(temp);
		}

		setupUI();
		setupSocket();
		draw();

		_csrf = $("input").attr("value");

	}

	function setupUI(){
		user.name = document.querySelector('#user').innerHTML.substring(9);
		if(user.name == ''){
			user.name = "Guest " + Math.floor(Math.random()*1000);

			var divString = '';
			divString += '<p>Login to be able to submit score</p>';

			document.querySelector('#score').innerHTML = divString;
		}
		else{
			hasAccount = true;

			var divString = '';
			divString += '<p>No record yet</p>';
			divString += '<p>Record will show after a game session ends</p>';

			document.querySelector('#score').innerHTML = divString;
		}

		document.querySelector('#createRoom').onclick = function(e){

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
	}

	// sets up the socket
	function setupSocket(){
		socket.emit('join', {
			name: user.name
		});

		// updates player movements & bullets
		socket.on('updateGame', function(data){
			players = data.players;
			arrayBullets = data.arrayBullets;
			enemy = {
				hp: data.enemyHp,
				maxHp: data.enemyMaxHp,
				damage: data.enemyDamage,
				name: data.enemyName,
				currentAttackDur: data.enemyCurrentAttackDur,
				attackDur: data.enemyAttackDur,
				currentRestDur: data.enemyCurrentRestDur,
				restDur: data.enemyRestDur
			};

			update(data.dt);
		});

		// update game lobby
		socket.on('updateGameLobby', function(data){
			players = data.players;

			update(0);
		});

		// update game lobby
		socket.on('starting', function(data){
			started = data.start;
			players = data.players;
			var keys = Object.keys(players);
			for(var i = 0; i < keys.length; i++){
				if(keys[i] == user.name)user = players[keys[i]];
			}
		});

		// update data when players join game room
		socket.on('updateData', function(data){
			room = data.room;
			players = data.players;
			enemy = data.enemy;
			arrayBullets = arrayBullets;
			started = data.started;
			isLobby = false;
			var keys = Object.keys(players);
			for(var i = 0; i < keys.length; i++){
				if(keys[i] == user.name)user = players[keys[i]];
			}
			document.querySelector('#createRoom').style.visibility = 'hidden';
			document.querySelector('#joinRoom').style.visibility = 'hidden';
			draw();
		});

		socket.on('gameEnded', function(data){
			started = false;
			// record party size, player name, player lvl, class, min~max damage, death num, max hp, max energy, enemy killed,
			var keys = Object.keys(data.players);
			sessionRecord.partyLevel = 0;
			sessionRecord.partyDeaths = 0;

			for(var i = 0; i < keys.length; i++){
				if(keys[i] == user.name){
					var player = players[keys[i]];

					sessionRecord.size = keys.length;
					sessionRecord.name = player.name;
					sessionRecord.level = player.level;
					sessionRecord.type = player.type;
					sessionRecord.maxHp = player.maxHp;
					sessionRecord.maxEnergy = player.maxEnergy;
					sessionRecord.minDamage = player.minDamage;
					sessionRecord.maxDamage = player.maxDamage;
					sessionRecord.deaths = (player.reviveTime -1200)/600;
					sessionRecord.enemiesKilled = data.enemiesKilled;

				}
				sessionRecord.partyLevel += players[keys[i]].level;
				sessionRecord.partyDeaths += (players[keys[i]].reviveTime -1200)/600;
				console.log(data);
				sessionRecord.date = data.date;
			}

			// if not a guest change div score to show score to see if they want to submit it
			if(hasAccount === true){

				var divString = '<h2>' + sessionRecord.date + '</h2>';
				divString += '';
				divString += '<div id="recordData">';
					divString += '<h3 class="right">Party Info</h3>';
					divString += '<h3>Player Name: ' + sessionRecord.name + '</h3>';

					divString += '<div id="left">';
						divString += '<p>Class: ' + sessionRecord.type + '</p>';
						divString += '<p>Level: ' + sessionRecord.level + '</p>';
						divString += '<p>Max Hp: ' + sessionRecord.maxHp + '</p>';
						divString += '<p>Max Energy: ' + sessionRecord.maxEnergy + '</p>';
						divString += '<p>Damage: ' + sessionRecord.minDamage + '~' + sessionRecord.maxDamage + '</p>';
						divString += '<p>Death Count: ' + sessionRecord.deaths + '</p>';
					divString += '</div>';

					divString += '<div id="right">';
						divString += '<p>Party Size: ' + sessionRecord.size + '</p>';
						divString += '<p>Party\'s Average Level: ' + Math.round(sessionRecord.partyLevel/sessionRecord.size) + '</p>';
						divString += '<p>Party Death Count: ' + sessionRecord.partyDeaths + '</p>';
						divString += '<p>Enemies Killed: ' + sessionRecord.enemiesKilled + '</p></div">';
					divString += '</div>';

					divString += '<button id="submitScore" action="/record">Submit</button>'
					divString += '<div class="clear"></div>';

				divString += '</div">';

				document.querySelector('#score').innerHTML = divString;
				document.querySelector('#submitScore').style.display = 'block';

				document.querySelector('#submitScore').onclick = function(e){
					var dataString = 'type=' + sessionRecord.type;
					dataString += '&level=' + sessionRecord.level;
					dataString += '&maxHp=' + sessionRecord.maxHp;
					dataString += '&maxEnergy=' + sessionRecord.maxEnergy;
					dataString += '&minDamage=' + sessionRecord.minDamage;
					dataString += '&maxDamage=' + sessionRecord.maxDamage;
					dataString += '&deaths=' + sessionRecord.deaths;
					dataString += '&partySize=' + sessionRecord.size;
					dataString += '&partyLevel=' + Math.round(sessionRecord.partyLevel/sessionRecord.size);
					dataString += '&partyDeaths=' + sessionRecord.partyDeaths;
					dataString += '&enemiesKilled=' + sessionRecord.enemiesKilled;
					dataString += '&date=' + sessionRecord.date;
					dataString += '&_csrf=' + _csrf;

					$.ajax({
			            cache: false,
			            type: "POST",
			            url: $("#submitScore").attr("action"),
			            data: dataString,
			            dataType: "json",
			            success: function(result, status, xhr) {
			            	if(result.success != null){
			                	document.querySelector('#submitScore').style.display = 'none';
			        			document.querySelector('#score').innerHTML += "<p>success!</p>";
			                }
			            },
			            error: function(xhr, status, error) {
			                document.querySelector('#submitScore').innerHTML = 'An error Occured';
		            	}
        			});  
				};
				
			}
		});
	}

	// update
	function update(dt){
		if(started === true){
			var keys = Object.keys(players);
			// Find the clients username and update only his data
			for(var i = 0; i < keys.length; i++){
				if(keys[i] == user.name){

					var player = players[keys[i]];

					var speed = player.speed;
					updated = false;
					damage = 0;

					//movement restriction on active skills
					if(player.skill1Used === true) speed *= .5;
					if(player.skill2Used === true) speed *= .5;

					if(myKeys.keydown[myKeys.KEYBOARD.KEY_W] === true){
						if(myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT] === true) user.pos.y += (-player.speed/2) * dt;
						else user.pos.y += -speed * dt;
						updated = true;
					}
					if(myKeys.keydown[myKeys.KEYBOARD.KEY_A] === true){
						if(myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT] === true) user.pos.x += (-player.speed/2) * dt;
						else user.pos.x += -speed * dt;
						updated = true;
					}
					if(myKeys.keydown[myKeys.KEYBOARD.KEY_S] === true){
						if(myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT] === true) user.pos.y += (player.speed/2) * dt;
						else user.pos.y += speed * dt;
						updated = true;
					}
					if(myKeys.keydown[myKeys.KEYBOARD.KEY_D] === true){
						if(myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT] === true) user.pos.x += (player.speed/2) * dt;
						else user.pos.x += speed * dt;
						updated = true;
					}

					// players can only use skills when alive

					if(player.alive === true && previousSkillButtonDown === false){
						if(myKeys.keydown[myKeys.KEYBOARD.KEY_J] === true){
							previousSkillButtonDown = true;

							if(player.currentAttackRate == 0){
								for(var i = 0; i<attackCircles.length; i++){
									var distance = circlesIntersect(user.pos, attackCircles[i].pos);
									if( distance < player.hitbox + attackCircles[i].radius){
										attackCircles[i].velocity = getRandomUnitVector();
										// calculate damage
										var accuracy = 1 - distance / (player.hitbox + attackCircles[i].radius);
										damage += Math.max(player.maxDamage * accuracy, player.minDamage);
									}
								}
							}
							updated = true;
						}

						if(myKeys.keydown[myKeys.KEYBOARD.KEY_K] === true){
							previousSkillButtonDown = true;

							if(player.skill1Used === false){
								player.skill1Used = true;
							}
							else{
								player.skill1Used = false;
							}

							updated = true;
						}

						if(myKeys.keydown[myKeys.KEYBOARD.KEY_L] === true){
							previousSkillButtonDown = true;

							if(player.skill2Used === false){
								player.skill2Used = true;
							}
							else{
								player.skill2Used = false;
							}

							updated = true;
						}
					}

					// prevent player from going out of bound
					user.pos.x = clamp(user.pos.x, player.hitbox, 640 - player.hitbox);
					user.pos.y = clamp(user.pos.y, player.hitbox, 510 - player.hitbox);

					for(var i = 0; i < attackCircles.length; i++){
						attackCircles[i].pos.x += attackCircles[i].velocity.x * 2;
						attackCircles[i].pos.y += attackCircles[i].velocity.y * 2;
						
						if(attackCircles[i].pos.x < 30){
							attackCircles[i].velocity.x *= -1;
							attackCircles[i].pos.x += attackCircles[i].velocity.x * 2;
						}
						if(attackCircles[i].pos.x > 610){
							attackCircles[i].velocity.x *= -1;
							attackCircles[i].pos.x += attackCircles[i].velocity.x * 2;
						}
						if(attackCircles[i].pos.y < 30){
							attackCircles[i].velocity.y *= -1;
							attackCircles[i].pos.y += attackCircles[i].velocity.y * 2;
						}
						if(attackCircles[i].pos.y > 480){
							attackCircles[i].velocity.y *= -1;
							attackCircles[i].pos.y += attackCircles[i].velocity.y * 2;
						}
						
					}

					// if this client's user moves, send to server to update other clients
					if(updated === true){
						socket.emit('updatePlayer', {
							name: player.name,
							pos: user.pos,
							damage: damage,
							skill1Used: player.skill1Used,
							skill2Used: player.skill2Used
						});
					}

					if(myKeys.keydown[myKeys.KEYBOARD.KEY_C] === true && previousSkillButtonDown === false){
						previousSkillButtonDown = true;

						if(viewControls) viewControls = false;
						else viewControls = true;

					}

					if(myKeys.keydown[myKeys.KEYBOARD.KEY_J] || myKeys.keydown[myKeys.KEYBOARD.KEY_K] || myKeys.keydown[myKeys.KEYBOARD.KEY_L] || myKeys.keydown[myKeys.KEYBOARD.KEY_C]){
						previousSkillButtonDown = true;
					}
					else{ 
						previousSkillButtonDown = false;
					}

					draw(dt);
					return;
				}
			}
		}
		else{
			var keys = Object.keys(players);
			// Find the clients username and update only his data
			for(var i = 0; i < keys.length; i++){
				if(keys[i] == user.name){
					var player = players[keys[i]];
					updated = false;

					if(user.ready == false){
						if(myKeys.keydown[myKeys.KEYBOARD.KEY_W] === true && previousSkillButtonDown === false){
							playerType--;
							if(playerType < 0){
								playerType = 3;
							}
							previousSkillButtonDown = true;
							updated = true;
						}
						if(myKeys.keydown[myKeys.KEYBOARD.KEY_S] === true && previousSkillButtonDown === false){
							playerType++;
							if(playerType > 3){
								playerType = 0;
							}
							previousSkillButtonDown = true;
							updated = true;
						}
					}

					if(myKeys.keydown[myKeys.KEYBOARD.KEY_J] === true && previousSkillButtonDown === false){
						user.ready = true;
						updated = true;
					}
					if(myKeys.keydown[myKeys.KEYBOARD.KEY_K] === true && previousSkillButtonDown === false){
						user.ready = false;
						updated = true;
					}

					if(myKeys.keydown[myKeys.KEYBOARD.KEY_W] || myKeys.keydown[myKeys.KEYBOARD.KEY_S] || myKeys.keydown[myKeys.KEYBOARD.KEY_J] || myKeys.keydown[myKeys.KEYBOARD.KEY_K]){
						previousSkillButtonDown = true;
					}
					else{ 
						previousSkillButtonDown = false;
					}
					


					if(updated === true){
						socket.emit('updateGameLobby', {
							type: playerType,
							ready: user.ready
						});
					}

					draw(dt);
					return;
				}
			}
		}
	}

	// draw other client's object
	function draw(dt){
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if(isLobby === true){
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			fillText(ctx, "Title", 640/2, 640/2 - 200, "50pt courier", "#ddd");

			ctx.textAlign = "left";

			fillText(ctx, "Control", 25, 640 - 160, "20pt courier", "#ddd");
			fillText(ctx, "WASD - Move", 25, 640 - 125, "15pt courier", "#ddd");
			fillText(ctx, "Shift - Reduce Speed", 25, 640 - 100, "15pt courier", "#ddd");
			fillText(ctx, "J - Attack", 25, 640 - 75, "15pt courier", "#ddd");
			fillText(ctx, "K/L - Skills", 25, 640 - 50, "15pt courier", "#ddd");

			fillText(ctx, "Instructions are Below", 350, 640 - 50, "15pt courier", "#ddd");
		}

		else{
			if(started === true){
				var keys = Object.keys(players);

				// Enemy Draw
				ctx.fillStyle = "purple";
				ctx.fillRect(300,50,40,40);

				ctx.textAlign = "left";
				fillText(ctx, enemy.name , 525, 25, "15pt courier", "#ddd");
				fillText(ctx, 'damage: ' + enemy.damage.toFixed(2) , 525, 45, "10pt courier", "#ddd");

				// bullet array draw
				for(var i = 0; i<arrayBullets.length; i++){
					if(arrayBullets[i].absorbed == false) ctx.fillStyle = "white";
					else ctx.fillStyle = "gray";

					ctx.beginPath();
					ctx.arc(arrayBullets[i].pos.x, arrayBullets[i].pos.y, arrayBullets[i].radius, 0, Math.PI * 2, false);
					ctx.fill();
					ctx.closePath();
				}

				// draw players
				for(var i = 0; i < keys.length; i++){
					var drawCall = players[ keys[i] ];

					if(drawCall.alive === true){
						if(drawCall.name == user.name){
							// Attack Circle Draw
							for(var j = 0; j < attackCircles.length; j++){
								if(drawCall.currentAttackRate == 0){
									ctx.textAlign = "center";
									ctx.textBaseline = "middle";
									fillText(ctx, "ATTACK!", attackCircles[j].pos.x, attackCircles[j].pos.y, "10pt courier", "#fff");
									ctx.fillStyle = 'rgba(' + user.color.r + ',' + user.color.g + ',' + user.color.b + ', .5)' ;
									ctx.beginPath();
									ctx.arc(attackCircles[j].pos.x, attackCircles[j].pos.y, attackCircles[j].radius, 0, Math.PI * 2, false);
									ctx.fill();
									ctx.closePath();
								}
								else{
									ctx.fillStyle = 'rgba(' + user.color.r + ',' + user.color.g + ',' + user.color.b + ', .2)' ;
									ctx.beginPath();
									ctx.arc(attackCircles[j].pos.x, attackCircles[j].pos.y, attackCircles[j].radius, 0, Math.PI * 2, false);
									ctx.fill();
									ctx.closePath();
								}
							}
						}// end attack circles

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
					ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox+1, Math.PI/2, Math.PI * (drawCall.currentExp / drawCall.exp) + Math.PI/2, false);
					ctx.stroke();
					ctx.closePath();

					// attack charge bar
					ctx.strokeStyle = 'rgb(255,255,255)';
					ctx.beginPath();
					ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox+1, Math.PI/2, -Math.PI * ( (drawCall.attackRate - drawCall.currentAttackRate) / drawCall.attackRate) + Math.PI/2, true);
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
							ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox + drawCall.grazeRadius, Math.PI/2, Math.PI * (drawCall.reviveTime - drawCall.reviveTimer) / (drawCall.reviveTime/2) + Math.PI/2, false);
							ctx.stroke();
							ctx.closePath();
					}
					ctx.beginPath();
					ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox, 0, Math.PI * 2, false);
					ctx.fill();
					ctx.closePath();

					// Players Stat/Skill HUD
					ctx.fillStyle = "rgba(0,0,0,.5)";
					ctx.strokeStyle = "white";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillRect(2+ i * 159,510, 159, 128);
					ctx.strokeRect(2+ i * 159,510, 159, 128);
					fillText(ctx, drawCall.name, 79 + i * 159 , 525, "15pt courier", "rgb(" + drawCall.color.r  +"," + drawCall.color.g + "," + drawCall.color.b + ")");
					fillText(ctx, "Damage: " + drawCall.minDamage + "~" + drawCall.maxDamage,  79 + i * 159 , 545, "12pt courier", "#ddd");
					
					if(drawCall.skill1Used && drawCall.energy > drawCall.skill1Cost){
						ctx.save();
						ctx.fillStyle = "rgb(255, 255, 255)";
						ctx.fillRect(25 + i*159, 565, 50, 50);
						ctx.restore();
					}
					else if(drawCall.energy > drawCall.skill1Cost ){
						ctx.save();
						ctx.fillStyle = "rgba(255, 255, 255, .5)";
						ctx.strokeStyle = '#ddd'
						ctx.lineWidth = 1;
						ctx.fillRect(25 + i*159, 565, 50, 50);

						ctx.restore();
					}
					ctx.strokeRect(25 + i*159, 565, 50, 50);

					if(drawCall.skill2Used && drawCall.energy > drawCall.skill2Cost){
						ctx.save();
						ctx.fillStyle = "rgb(255, 255, 255)";
						ctx.fillRect(85 + i*159, 565, 50, 50);
						ctx.restore();
					}
					else if(drawCall.energy > drawCall.skill2Cost ){
						ctx.save();
						ctx.fillStyle = "rgba(255, 255, 255, .5)";
						ctx.fillRect(85 + i*159, 565, 50, 50);
						ctx.restore();

						if(drawCall.type == 'bomber'){
							ctx.beginPath();
							ctx.arc(drawCall.pos.x, drawCall.pos.y, drawCall.hitbox + (drawCall.grazeRadius * ( drawCall.energy/5)), 0, Math.PI * 2, false);
							ctx.stroke();
							ctx.closePath();
						}
					}
					ctx.strokeRect(85 + i*159, 565, 50, 50);
					fillText(ctx, "K", 50 + i * 159 , 628, "12pt courier", "#ddd");
					fillText(ctx, "L", 110 + i * 159 , 628, "12pt courier", "#ddd");
				} // End of player related draw
				
				//bottom box
				ctx.strokeRect(2,510, 636, 128);

				// enemy hp and attack duration
				ctx.strokeStyle = "red";
				ctx.beginPath();
				ctx.arc(320, 70, 50 , Math.PI/2 , Math.PI * (enemy.hp / (enemy.maxHp/2)) + Math.PI/2 , false);
				ctx.stroke();
				ctx.closePath();

				ctx.strokeStyle = "white";
				ctx.fillStyle = "rgba(255, 255, 255, .5)";
				if(enemy.currentRestDur <= 0){

					fillText(ctx, "Enemy is attacking!" , 320, 460, "10pt courier", "#ddd");
					ctx.strokeRect(270,480, 100, 10);
					ctx.fillRect(270,480, (100 * enemy.currentAttackDur/enemy.attackDur), 10);
				}
				else{
					fillText(ctx, "Enemy is charge attack!" , 320, 460, "10pt courier", "#ddd");
					ctx.strokeRect(270,480, 100, 10);
					ctx.fillRect(270,480, 100 - (100* enemy.currentRestDur/enemy.restDur), 10);
				}

				// draw hud				
				ctx.fillStyle = 'white';
				ctx.textAlign = "left";
				ctx.textBaseline = "middle";
				fillText(ctx, "Room: " + room, 10, 20, "10pt courier", "#ddd");
				fillText(ctx, "View Controls - 'C'", 10, 35, "10pt courier", "#ddd");
				if(viewControls){
					fillText(ctx, 'dt: ' + dt.toFixed(3), 10, 60, "10pt courier", "#ddd");
					fillText(ctx, "Move - WASD", 10, 380, "12pt courier", "#ddd");
					fillText(ctx, "Reduce Speed - Shift", 10, 400, "12pt courier", "#ddd");
					fillText(ctx, "Attack - J", 10, 420, "12pt courier", "#ddd");
					fillText(ctx, "Skill 1 - K", 10, 440, "12pt courier", "#ddd");
					if(user.type == 'fighter'){
						fillText(ctx, "Finisher - 5 Energy", 15, 455, "10pt courier", "#ddd");
					}
					else if (user.type == 'bomber'){
						fillText(ctx, "Focused Bomb - 10 Energy", 15, 455, "10pt courier", "#ddd");
					}
					else if( user.type == 'supplier'){
						fillText(ctx, "Exp Generator - 6 Energy/per sec", 15, 455, "10pt courier", "#ddd");
					}
					else if( user.type == 'aura'){
						fillText(ctx, "Healing Aura - 6 Energy/per sec", 15, 455, "10pt courier", "#ddd");
					}
					fillText(ctx, "Skill 2 - L", 10, 480, "12pt courier", "#ddd");
					if(user.type == 'fighter'){
						fillText(ctx, "Judgement - +10 Energy", 15, 495, "10pt courier", "#ddd");
					}
					else if (user.type == 'bomber'){
						fillText(ctx, "Energy Disperse - +15 Energy", 15, 495, "10pt courier", "#ddd");
					}
					else if( user.type == 'supplier'){
						fillText(ctx, "Energy Regen - 6 Energy/per sec", 15, 495, "10pt courier", "#ddd");
					}
					else if( user.type == 'aura'){
						fillText(ctx, "Burning Aura - 6 Energy/per sec", 15, 495, "10pt courier", "#ddd");
					}
				}
			}
			// GAME LOBBY
			else{
				ctx.textAlign = "left";
				ctx.textBaseline = "middle";

				ctx.lineWidth = 2;
				ctx.strokeRect(162,2, 476, 456);
				fillText(ctx, "Room: " + room, 175 , 20, "12pt courier", "#ddd");
				fillText(ctx, "Select - J", 530 , 20, "12pt courier", "#ddd");
				fillText(ctx, "Cancel - K", 530 , 40, "12pt courier", "#ddd");


				ctx.strokeStyle = 'white';
				ctx.fillStyle = 'rgba(255,255,255,.5)';

				fillText(ctx, "Stats Growth", 200 , 90, "18pt courier", "#ddd");
				fillText(ctx, "Health:", 200 , 125, "12pt courier", "#ddd");
				fillText(ctx, "Energy:", 200 , 150, "12pt courier", "#ddd");
				fillText(ctx, "Attack:", 200 , 175, "12pt courier", "#ddd");
				fillText(ctx, "Hitbox:", 200 , 200, "12pt courier", "#ddd");
				fillText(ctx, "Graze:", 200 , 225, "12pt courier", "#ddd");
				fillText(ctx, "Speed:", 200 , 250, "12pt courier", "#ddd");
				fillText(ctx, "Size:", 200 , 275, "12pt courier", "#ddd");

				fillText(ctx, "Skills/", 400 , 90, "18pt courier", "#ddd");
				fillText(ctx, "Energy cost", 500 , 90, "12pt courier", "#ddd");

				fillText(ctx, "Skill Info", 325 , 310, "18pt courier", "#ddd");


				// Left Side bar
				ctx.strokeRect(2,2, 158, 456);
				ctx.strokeRect(15,125, 125, 50);
				ctx.strokeRect(15,200, 125, 50);
				ctx.strokeRect(15,275, 125, 50);
				ctx.strokeRect(15,350, 125, 50);
				ctx.textAlign = "center";

				if(playerType == 0){
					ctx.fillRect(15,125, 125, 50);
					fillText(ctx, "Fighter", 400 , 50, "18pt courier", "#ddd");
					ctx.textAlign = "left";

					fillText(ctx, "Average", 275 , 125, "12pt courier", "#ddd");
					fillText(ctx, "Low", 275 , 150, "12pt courier", "#ddd");
					fillText(ctx, "High", 275 , 175, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 200, "12pt courier", "#ddd");
					fillText(ctx, "Small", 275 , 225, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 250, "12pt courier", "#ddd");
					fillText(ctx, "Medium", 275 , 275, "12pt courier", "#ddd");

					fillText(ctx, "Finisher", 400 , 125, "12pt courier", "#ddd");
					fillText(ctx, "High Damage", 425 , 145, "12pt courier", "#ddd");
					fillText(ctx, "5 Energy", 425 , 165, "12pt courier", "#ddd");

					fillText(ctx, "Judgement", 400 , 200, "12pt courier", "#ddd");
					fillText(ctx, "Very High Damage", 425 , 220, "12pt courier", "#ddd");
					fillText(ctx, "+10 Energy", 425 , 240, "12pt courier", "#ddd");

					fillText(ctx, "Finisher", 200 , 325, "14pt courier", "#ddd");
					fillText(ctx, "Does max damage and heals 10% more hp", 210 , 345, "12pt courier", "#ddd");
					fillText(ctx, "if it kills the enemy.", 210 , 365, "12pt courier", "#ddd");
					fillText(ctx, "Judgement", 200 , 390, "14pt courier", "#ddd");
					fillText(ctx, "Uses all energy. Damage scales with energy.", 210 , 410, "12pt courier", "#ddd");
					fillText(ctx, "If it kills enemy, player will not heal.", 210 , 430, "12pt courier", "#ff3333");

				}
				else if(playerType == 1){
					ctx.fillRect(15,200, 125, 50);
					fillText(ctx, "Bomber", 400 , 50, "18pt courier", "#ddd");
					ctx.textAlign = "left";

					fillText(ctx, "High", 275 , 125, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 150, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 175, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 200, "12pt courier", "#ddd");
					fillText(ctx, "High", 275 , 225, "12pt courier", "#ddd");
					fillText(ctx, "Low", 275 , 250, "12pt courier", "#ddd");
					fillText(ctx, "Large", 275 , 275, "12pt courier", "#ddd");

					fillText(ctx, "Focused Bomb", 400 , 125, "12pt courier", "#ddd");
					fillText(ctx, "Destroys enemy bullets", 425 , 145, "10pt courier", "#ddd");
					fillText(ctx, "Average Damage", 425 , 165, "12pt courier", "#ddd");
					fillText(ctx, "10 Energy", 425 , 185, "12pt courier", "#ddd");

					fillText(ctx, "Energy Disperse", 400 , 220, "12pt courier", "#ddd");
					fillText(ctx, "Destroys enemy bullets", 425 , 240, "10pt courier", "#ddd");
					fillText(ctx, "Low Damage", 425 , 260, "12pt courier", "#ddd");
					fillText(ctx, "+15 Energy", 425 , 280, "12pt courier", "#ddd");

					fillText(ctx, "Focused Bomb", 200 , 325, "14pt courier", "#ddd");
					fillText(ctx, "Does max damage and destroys bullets", 210 , 345, "12pt courier", "#ddd");
					fillText(ctx, "in player's graze radius.", 210 , 365, "12pt courier", "#ddd");
					fillText(ctx, "Energy Disperse", 200 , 390, "14pt courier", "#ddd");
					fillText(ctx, "Does min damage and destroys bullets.", 210 , 410, "12pt courier", "#ddd");
					fillText(ctx, "Range is shown when useable.", 210 , 430, "12pt courier", "#ddd");
				}
				else if(playerType == 2){
					ctx.fillRect(15,275, 125, 50);
					fillText(ctx, "Supplier", 400 , 50, "18pt courier", "#ddd");
					ctx.textAlign = "left";

					fillText(ctx, "Low", 275 , 125, "12pt courier", "#ddd");
					fillText(ctx, "Low", 275 , 150, "12pt courier", "#ddd");
					fillText(ctx, "Low", 275 , 175, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 200, "12pt courier", "#ddd");
					fillText(ctx, "High", 275 , 225, "12pt courier", "#ddd");
					fillText(ctx, "High", 275 , 250, "12pt courier", "#ddd");
					fillText(ctx, "Small", 275 , 275, "12pt courier", "#ddd");

					fillText(ctx, "Exp Gain", 400 , 125, "12pt courier", "#ddd");
					fillText(ctx, "Convert energy into exp", 425 , 145, "10pt courier", "#ddd");
					fillText(ctx, "6 Energy/per sec", 425 , 165, "12pt courier", "#ddd");

					fillText(ctx, "Energy Drain", 400 , 200, "12pt courier", "#ddd");
					fillText(ctx, "Regen Allie's Energy", 425 , 220, "12pt courier", "#ddd");
					fillText(ctx, "Low Damage", 425 , 240, "12pt courier", "#ddd");
					fillText(ctx, "6 Energy/per sec", 425 , 260, "12pt courier", "#ddd");

					fillText(ctx, "Exp Gain", 200 , 325, "14pt courier", "#ddd");
					fillText(ctx, "Slowly drains your energy and converts", 210 , 345, "12pt courier", "#ddd");
					fillText(ctx, "it into exp for all party members.", 210 , 365, "12pt courier", "#ddd");
					fillText(ctx, "Energy Drain", 200 , 390, "14pt courier", "#ddd");
					fillText(ctx, "Slowly drains your energy to deal damage", 210 , 410, "12pt courier", "#ddd");
					fillText(ctx, "and regen other party member's energy.", 210 , 430, "12pt courier", "#ddd");
				}
				else{
					ctx.fillRect(15,350, 125, 50);
					fillText(ctx, "Aura", 400 , 50, "18pt courier", "#ddd");
					ctx.textAlign = "left";

					fillText(ctx, "Low", 275 , 125, "12pt courier", "#ddd");
					fillText(ctx, "High", 275 , 150, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 175, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 200, "12pt courier", "#ddd");
					fillText(ctx, "Average", 275 , 225, "12pt courier", "#ddd");
					fillText(ctx, "Low", 275 , 250, "12pt courier", "#ddd");
					fillText(ctx, "Small", 275 , 275, "12pt courier", "#ddd");

					fillText(ctx, "Healing Aura", 400 , 125, "12pt courier", "#ddd");
					fillText(ctx, "Heal's Party", 425 , 145, "12pt courier", "#ddd");
					fillText(ctx, "6 Energy/per sec", 425 , 165, "12pt courier", "#ddd");

					fillText(ctx, "Burning Aura", 400 , 200, "12pt courier", "#ddd");
					fillText(ctx, "Average Damage", 425 , 220, "12pt courier", "#ddd");
					fillText(ctx, "6 Energy/per sec", 425 , 240, "12pt courier", "#ddd");

					fillText(ctx, "Healing Aura", 200 , 325, "14pt courier", "#ddd");
					fillText(ctx, "Slowly drains your energy to heal all", 210 , 345, "12pt courier", "#ddd");
					fillText(ctx, "party members.", 210 , 365, "12pt courier", "#ddd");
					fillText(ctx, "Burning Aura", 200 , 390, "14pt courier", "#ddd");
					fillText(ctx, "Slowly drains your energy to deal damage", 210 , 410, "12pt courier", "#ddd");
					fillText(ctx, "to the enemy.", 210 , 430, "12pt courier", "#ddd");

				}
				ctx.textAlign = "center";

				fillText(ctx, "Classes", 75 , 50, "15pt courier", "#ddd");
				fillText(ctx, "Fighter", 75 , 150, "15pt courier", "#ddd");
				fillText(ctx, "Bomber", 75 , 225, "15pt courier", "#ddd");
				fillText(ctx, "Supplier", 75 , 300, "15pt courier", "#ddd");
				fillText(ctx, "Aura", 75 , 375, "15pt courier", "#ddd");

				//bottom box
				ctx.strokeRect(2,510, 636, 128);
				ctx.strokeRect(2,460, 636, 50);

				var keys = Object.keys(players);
				for(var i = 0; i < keys.length; i++){
					var drawCall = players[ keys[i] ];

					// Players Stat/Skill HUD
					if(drawCall.ready === true){
						ctx.fillStyle = "rgb(0,255,0)";
						ctx.fillRect(2+ i * 159,460, 159, 48);
					}
					ctx.fillStyle = "rgba(0,0,0,.5)";
					ctx.strokeStyle = "white";
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillRect(2+ i * 159,460, 159, 178);
					ctx.strokeRect(2+ i * 159,460, 159, 178);
					// class Name
					if( drawCall.type == 0) fillText(ctx, "Fighter", 79 + i * 159 , 490, "15pt courier", "#ddd");
					else if( drawCall.type == 1) fillText(ctx, "Bomber", 79 + i * 159 , 490, "15pt courier", "#ddd");
					else if( drawCall.type == 2) fillText(ctx, "Supplier", 79 + i * 159 , 490, "15pt courier", "#ddd");
					else if( drawCall.type == 3) fillText(ctx, "Aura", 79 + i * 159 , 490, "15pt courier", "#ddd");
					else fillText(ctx, "Fighter", 79 + i * 159 , 490, "15pt courier", "#ddd");

					if( i == 0) fillText(ctx, drawCall.name, 79 + i * 159 , 525, "15pt courier", "rgb(255,0,0)");
					else if( i == 1) fillText(ctx, drawCall.name, 79 + i * 159 , 525, "15pt courier", "rgb(0,255,0)");
					else if( i == 2) fillText(ctx, drawCall.name, 79 + i * 159 , 525, "15pt courier", "rgb(0,255,255)");
					else if( i == 3) fillText(ctx, drawCall.name, 79 + i * 159 , 525, "15pt courier", "rgb(255,165,0)");

					ctx.strokeRect(25 + i*159, 565, 50, 50);
					ctx.strokeRect(85 + i*159, 565, 50, 50);
					fillText(ctx, "K", 50 + i * 159 , 628, "12pt courier", "#ddd");
					fillText(ctx, "L", 110 + i * 159 , 628, "12pt courier", "#ddd");
				}
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

	function circlesIntersect(c1,c2){
		var dx = c2.x - c1.x;
		var dy = c2.y - c1.y;
		var distance = Math.sqrt(dx*dx + dy*dy);
		return distance;
	}

	function getRandomUnitVector(){
		var x = Math.random() * 2 - 1;
		var y = Math.random() * 2 - 1;
		var length = Math.sqrt(x*x + y*y);
		if(length == 0){ // very unlikely
			x=1; // point right
			y=0;
			length = 1;
		} else{
			x /= length;
			y /= length;
		}
		
		return {x:x, y:y};
	}

	// Keyboard stuff
	var myKeys = {};
	myKeys.KEYBOARD = {
		"KEY_SHIFT": 16,
		"KEY_C": 67,
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