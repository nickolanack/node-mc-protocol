This is an attempt at updating the origional protocol to work with mc 1.8 

I have no intention to push any changes back into the 1.7.10 version since that version works fine with 1.7.10 servers.

To simplify the process, for myself, the mc server is being run on the same host as the client, (disables encryption) and compresion is also disabled. I don't really know that much about mc, but the protocol is pretty well described at http://wiki.vg/Protocol 

For me this is an attempt at creating an Automated client, to play minecraft with my son so I can do more interesting things like learn about AI programming. Minecraft itself does not interest me as much as creating a generic ai player. I am planing to create generic tools like inventory, senses, movement, etc, that can be used to interpret and interact with the players surroundings but likely abstract the minecraft specific details.


get a server started locally:

create an mc server and modify server.properties file:
```
   online-mode=false
   network-compression-threshold=-1
```

get the js client running:
you kindof need to understand node to get this part working, you probably need to npm install minecraft-protocol and 
then update client.js, protocol.js, and index.js (I think those are the only files I will modify). the client folder 
contains useful javascript tools for actually interacting with the world. 

see mc-node.js which basically just logs the 
player in, and then has it try to follow the first real player around by watching the player and walking/running toward 
them unless it cannot figure out how. It is currently not smart enough to go arround blocks placed in it's path although
I've implemented an A* shortest path algorithm that should tak care of that.

```js
var mc = require('minecraft-protocol'); 
var client=mc.createClient({
		port: 8080,  //this also needs to match server.properties setting: server-port   
		username: 'neo',
	});
	
```




```js

client.on('login',function(data){
	var itemMap=require('.client/mc-items.json'); //just an array with id's codes, and names of items
	
	// scog, provides methods for getting spatial information about the world. uses itemMap for 
	// deciding if blocks are doors or air etc..
	var scog=require('.client/mc-spatial.js').createSpatialCognizance(client, itemMap);
	
	// movement will imediately start sending udpates about the client's position. 
	// use movement to walkTo, runTo, jump, crouch....
	var movement=require('.client/mc-movement.js').createMovement(client, scog);
});	
```
	

here is a example of getting the player to stare at you... creepy

```js
//ecog provides methods for interacting with entities, including other players
var ecog=require('./mc-entities.js').createEntityCognizance(client);
ecog.once('detect.player',function(id){
	var last;
	var watch=function(){
		//ecog.watch starts returning position updates for an entity
		ecog.watch(id, function(p){
			//this callback function recieves updated for the entity's position
			if(p){
				movement.lookAtPoint(p);
				last=p;
			}
					
		},function(err){
			//this callback is fired after timeout or if watch failed for somereason.		
			var dist=movement.measureTo(last);
			if(dist<30){
				//watch again for 5 sec
				watch();
			}else{
				//stop watching look straight
				movement.look({pitch:0});
			}
					
		}, 5000); //watch_task=watch for 5 seconds and then... watch_task ...
	};
	watch();
});

```
