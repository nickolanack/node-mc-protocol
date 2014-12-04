This is an attempt at updating the origional protocol to work with mc 1.8

To simplify the process, mc server is being run on the same host as the client, (disables encryption) and compresion is 
also disabled. I don't really know that much about mc, but the protocol is pretty well described at http://wiki.vg/Protocol 

for me this is an attempt at creating an Automated client, to play minecraft with my son so I can do more interesting things like learn about AI programming.


get a server started locally:

create an mc server and modify server.properties file:
```
   online-mode=false
   network-compression-threshold=-1
```

get the js client running:
```js
var mc = require('minecraft-protocol');
var client=mc.createClient({
		port: 8080,         
		username: name,
	});
	
```
	
