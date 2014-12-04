

var mc = require('minecraft-protocol');
var host='localhost';
var port=8080;




//client.on('packet', function(p, name) {
//        console.log('recieve '+name+':'+JSON.stringify(p));
//});



//client.on('write', function(p) {
//        console.log('write: '+JSON.stringify(p));
//});



//client.on('data', function(id, size, data, state, isServer, packetsToParse){
//    if(id!==null)console.log('packetId: '+id);
//	if(id==19){
//		 	console.log(id+": "+size+": "+ JSON.stringify(data)+',  '+state+ ', '+isServer+', '+JSON.stringify(packetsToParse));	
//	}
//});


['morpheus'].forEach(function(name){
	
	
	
	var client=mc.createClient({
		port: 8080,         
		username: name,
	});

	
	client.on('login',function(data){
		console.log('login: '+JSON.stringify(data));
		console.log(client.uuid+' '+client.username);
		client.entityId=data.entityId;
		
		
		var itemMap=require('./mc-items.json');
		
		
		
		
		// collection of state detection elements internal external
		var senses=require('./mc-senses.js').createSenses(client, mc);
		var inventory=require('./mc-inventory.js').createInventory(client, itemMap);
		
		var ecog=require('./mc-entities.js').createEntityCognizance(client);
	
		//var spatialcognizance=require('./mc-spatial.js').createSpatialCognizance(client, mc);
		
		//time detection
		senses.on('time.day', function(){
			client.write('chat',{message:'it is day now'});
		});
		senses.on('time.night', function(){
			client.write('chat',{message:'it is night now'});
		});
		
		//weather detection
		senses.on('rain.true', function(){
			var msgs=['did someone step on a spider...?', 'it\'s raining cats and dogs', 'dang, it\'s raining', 'I hope you like rain', 'It\'s pooring rain outside','I hate rain', 'hey I need an umbrella', 'oh, rain. great...', 'it started to rain just now.', 'rain!', 'rain rain go away...', 'it\'s raining', 'rain... blah.'];
			client.write('chat',{message:msgs[Math.floor(Math.random()*msgs.length)]});
		});
		
		senses.on('rain.false', function(){
			var msgs=['it finally stopped raining', 'the rain stopped', 'the weather has gotten better', 'the suns out', 'it stopped raining'];
			client.write('chat',{message:msgs[Math.floor(Math.random()*msgs.length)]});
		});
		
		senses.on('health', function(to, from){
			console.log('health change,  from: '+from+' to: '+to);
		});
		
		
		
		
		// movement controller. contains moveTo, moveToRelative, look, lookAtPoint, jump, etc
		
		var scog=require('./mc-spatial.js').createSpatialCognizance(client, itemMap);
		var movement=require('./mc-movement.js').createMovement(client, scog);
		
		
		//attach stdinput listener, and pass movement as one commandline accessable item;
		
		
		

		// var awareness;	 // uses a collection of senses to provide information about surroundings, as well as internal state
						 // to create a set of needs
		// var actions;    // a collection of possible ways to change the current internal and external state

		// var objectives //
		
		
		
		
		senses.on('death',function(){
			client.write('client_command', {payload:0});
		});
		
		//as soon as the first player is detected 
		//start watching (lookAt) that player. 
		//when the player moves away at lease x blocks start following
		//if the player manages to move y blocks then stop following...
		
		var spatial=require('./mc-spatial.js').math;
		
		ecog.on('detect.enemy',function(id, type){
			ecog.on('update.position.'+id, function(p){
				var d=spatial.point3DMeasure(movement.position, p);
				if(d<20){
					
				}
				
			});
		});
		
		inventory.on('collected',function(){
			inventory.autoequip();
		});
		
		
		ecog.once('detect.player',function(id){
			
			//path finder uses path finding algorithms to find routes to points where
			//the straight line is obstructed.
			var pathfinder=require('./mc-pathfinder.js').createPathfinder(scog);
		
			console.log('detected player: '+id);
			
			var last=null;
			
			var following=false;
			var follow=function(){
				if(following)return;
				
				
				if(last!==null){
					var dist=movement.measureTo(last);
					if(dist>4&&dist<20){
						following=true;
						if(dist<10){
							movement.walkToward(last, pathfinder, 800, function(err){
							
								following=false;
								if(err){
									return;
								}
								follow();
							});
						}else{
							movement.runToward(last, pathfinder, 800, function(err){
								
								following=false;
								if(err){
									return;
								}
								follow();
							});
						}
					}else{
						//console.log('not/stopped following: '+dist+'b');
					}
				}
			};
			
			var watch=function(){
				ecog.watch(id, function(p){
					
					if(p){
						
						movement.lookAtPoint(p);
						last=p;
						follow();
						
					}
					
				},function(err){
					
					var dist=movement.measureTo(last);
					if(dist<30){
						//quit if player gets away
						if(dist>20){
							//client too slow, or player too fast
							var msgs=['I\'m having a hard time keeping up', 'slow your roll', 'can we get a stretch break?', 'could you slow down a bit', 'wait up', 'I need to catch my breath', 'oh my gosh.. your too fast', 'I gotta quit smoking'];
							client.write('chat',{message:msgs[Math.floor(Math.random()*msgs.length)]});
						}
						watch();
					}else{
						movement.look({pitch:0});
					}
					
				}, 5000); //watch_task=watch for 5 seconds and then... watch_task ...
			};
			watch();
			movement.on('move',function(){
				if(last!==null){
					movement.lookAtPoint(last);
				}
			});
			
	
			
			
		});
		
		
		
		
		//add command line interface. can control movement using stdin
		require('./mc-cli.js').listen(client, {
			movement:movement, 
			inventory:inventory,
			spatial:scog
		});
		
		
	});
	
	client.on('state',function(state, last){
		console.log('state: from '+last+' to '+state);
	});

	client.on('end',function(reason){
		console.log('ended: '+reason);
	});

	client.on('error',function(reason){
	        console.log('error: '+reason);
	        process.exit(1);
	});

	
	
	
	
	

	
	
	
	
	
	
});


