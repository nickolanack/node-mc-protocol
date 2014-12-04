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
	var itemMap=require('.client/mc-items.json');
	var scog=require('.client/mc-spatial.js').createSpatialCognizance(client, itemMap);
	var movement=require('.client/mc-movement.js').createMovement(client, scog);
	
```
	
