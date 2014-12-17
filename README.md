*This is an attempt at updating the origional protocol to work with mc 1.8*
*I have no intention to push any changes back into the 1.7.10 version since that version works fine with 1.7.10 servers.*

##Node Minecraft Protocol 1.8##

To simplify the process, for myself, the mc server is being run on the same host as the client, (disables encryption) and compresion is also disabled. I don't really know that much about mc, but the protocol is pretty well described at http://wiki.vg/Protocol 

###Get Started###

Create an mc server and modify server.properties file with:
```
   online-mode=false
   network-compression-threshold=-1
```

To get the client going you should have an idea of how nodejs works (I'm just learning myself)

1. install nodejs, amd npm install minecraft-protocol.
2. you can either update the minecraft-protocol files with the ones in this repository or...

- what I like to do is create a project with *'node_modules folder'*, and *'node-minecraft-protocol'* folder at the root.
- the node modules folder will contain all the requirements of the origional node-minecraft-protocol and the contents
- of this repo go into node-minecraft-protocol. Then any code that I write requires node-minecraft-protocol like
- require('./node-minecraft-protocol/index.js') and node knows to load requirements from node_modules...

to see the progress on my minecraft-agent go to https://github.com/nickolanack/node-minecraft-agent
