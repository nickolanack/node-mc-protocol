
function createSpatialCognizance(client, itemMap){
	
	var scog=new SpatialCognizance();	
	
//	setInterval(function(){
//		
//		scog.list();
//		
//	},10000);
	
	scog.setItemMap(itemMap);
	
	client.on('map_chunk',function(data){
		//console.log('map_chunk: '+JSON.stringify(data));
	});
	
	client.on('multi_block_change',function(data){
		//console.log('multi_block_change: '+JSON.stringify(data));
	});
	
	client.on('block_change',function(data){
		console.log('block_change: '+JSON.stringify(data));
		var blocktype=data.type
		var id=blocktype>>4;
    	var meta=blocktype&0xF;
    	
		scog.updateBlock(data.position, [id, meta]);
	});

	
	client.on('block_action',function(data){
		//console.log('block_action: '+JSON.stringify(data));
	});

	client.on('block_break_animation',function(data){
		//console.log('block_break_animation: '+JSON.stringify(data));
	});

	
	client.on('map_chunk_bulk',function(data){
		var chunkdata=data.data;
		delete data.data;
		
		var sizeOfChunk=Math.pow(16,3)*2; //bytes per non empty chunk
		
		//console.log(JSON.stringify(data)+' chunkdata['+chunkdata.length+']');
		var cursor=0;
		data.meta.forEach(function(chunkmeta){
			
			
			var cz=chunkmeta.z;
			var cx=chunkmeta.x;
			
			var continuous=true;
			var skylight=data.skyLightSent;
			
			
		
			
			for(var cy=0;cy<16;cy++) {
				
				//console.log('chunk: x:'+cx+', x:'+cy+', x:'+cz)
				
			    if (chunkmeta.bitMap & (1 << cy)) {
			    	
			    	
			    	/*
			    	
			    	
			    	var chunk=[];
			    	
			    	for(var y=0;y<16;y++){
			    		
			    		chunk[y]=[];
			    		
			    		for(var z=0;z<16;z++){
			    			
			    			chunk[y][z]=[];
			    			
			    			for(var x=0;x<16;x++){
			    				
			    				
			    				
			    				
			    				var blocktype=chunkdata.readUInt16LE(cursor);
						    	var id=blocktype>>4;
						    	var meta=blocktype&0xF;
						    	
						    	chunk[y][z][x]=[id, meta];
						    
						    	cursor+=2;
					    	}
				    	}
			    	}
			    	
			    	*/
			    
			    	var slice=chunkdata.slice(cursor, cursor+sizeOfChunk);
			    	cursor+=sizeOfChunk;
			    	scog.setChunk(cx,cy,cz, slice);
			    
			    }else{    	
			    	scog.setChunk(cx,cy,cz, null);
			    }
				
			
			}
			
			for(var cybl=0;cybl<16;cybl++) {
				if (chunkmeta.bitMap & (1 << cybl)) {
					
					//TODO: something with lights
			    	blocklights=chunkdata.slice(cursor, cursor+2048);
			    	cursor+=2048;
			    	//scog.setLight(cx,cy,cz, ...);
					
				}
			}
			
			if(skylight){
			for(var cysl=0;cysl<16;cysl++) {
				if (chunkmeta.bitMap & (1 << cysl)) {
					
			    	//TODO: something with skylights
			    	
		    		skylights=chunkdata.slice(cursor, cursor+2048);
			    	cursor+=2048;
			    	
			    	//scog.setSkylight(cx,cy,cz, ...);
		    	
				
				}
			}
			}
			
			
			
			if(continuous){
				
				//TODO: something with biomes
	    		biomes=chunkdata.slice(cursor, cursor+256);
		    	cursor+=256;
		    	
		    	//scog.setBiome(cx,/*cy,*/cz, ...);
	    	}
			
		});

		
	});

	client.on('explosion',function(data){
		//console.log('explosion: '+JSON.stringify(data));
	});
	
	client.on('world_event',function(data){
		//console.log('world_event: '+JSON.stringify(data));
	});
	
	client.on('named_sound_effect',function(data){
		//console.log('named_sound_effect: '+JSON.stringify(data));
	});
	
	client.on('world_particles',function(data){
		//console.log('world_particles: '+JSON.stringify(data));
	});
	
	client.on('spawn_entity_weather',function(data){
		//console.log('spawn_entity_weather: '+JSON.stringify(data));
	});
	
	return scog;
	
}

var events=require('events');
function SpatialCognizance(){
	events.EventEmitter.call(this); 

	
}

SpatialCognizance.prototype.__proto__ = events.EventEmitter.prototype;





SpatialCognizance.prototype.idToString=function(itemid, data){
	
	var me=this;
	if((typeof itemid)=='object'){
		return me.idToString(itemid.id, itemid.data);
	}
	
	if(data>0){
		var i=me._itemMap[0].indexOf(itemid+":"+data);

		if(i>=0){
			return me._itemMap[1][i];
		}
	}
	
	var i=me._itemMap[0].indexOf(itemid+":0");

	if(i>=0){
		return me._itemMap[1][i];
	}
	return 'unknown ('+itemid+':'+(data||0)+')';
	
};


var itc=0;
SpatialCognizance.prototype.idToCode=function(itemid, data){
	
	var me=this;
	if((typeof itemid)=='object'){
		return me.idToCode(itemid.id, itemid.data);
	}
	
	if(data>0){
		var i=me._itemMap[0].indexOf(itemid+":"+data);

		if(i>=0){
			return me._itemMap[2][i];
		}
	}
//	console.log(itemid);
//	itc++;
//	if(itc>100){
//		console.log((new Error('')).stack);
//	}
	var i=me._itemMap[0].indexOf(itemid+":0");

	if(i>=0){
		return me._itemMap[2][i];
	}
	return 'unknown code('+itemid+':'+(data||0)+')';
	
};


SpatialCognizance.prototype.stringToId=function(name){
	var me=this;
	var i=me._itemMap[1].indexOf(name);
	if(i>=0){
		var id=me._itemMap[0][i];
		parseInt(id.split(':')[0]);
	}
	
	return -1;
};

/*
 * data should be and array with 3 arrays. each of three arrays contains
 * a long array with ids, names, and 'minecraft:name' respectively
 */
SpatialCognizance.prototype.setItemMap=function(data){
	var me=this;
	me._itemMap=data;
};


SpatialCognizance.prototype.calcChunk=function(p){

	var pf=positionToBlockCoord(p);
	return {x:Math.floor(pf.x/16), y:Math.floor(pf.y/16), z:Math.floor(pf.z/16)};
	
};
SpatialCognizance.prototype.calcCursor=function(o){
	return (o.y*16*16+o.z*16+o.x)*2;
}

SpatialCognizance.prototype.calcBlockFromData=function(o, chunk){
	var me=this;
	var cursor=me.calcCursor(o);
	var blocktype=chunk.readUInt16LE(cursor);
	var id=blocktype>>4;
	var meta=blocktype&0xF;
	return {id:id, meta:meta};
}

SpatialCognizance.prototype.writeDataFromBlock=function(o, block,  chunk){
	var me=this;
	var cursor=me.calcCursor(o);
	chunk.writeUInt16BE(me.calcDataFromBlock(block), cursor);
}

SpatialCognizance.prototype.calcDataFromBlock=function(block){
	return (block.id<<4)+(block.meta&0xF);
}

SpatialCognizance.prototype.calcOffset=function(p){
	
	var me=this;
	var pf=positionToBlockCoord(p);
	var c=me.calcChunk(p);
	
	return {x:pf.x-(c.x*16), y:pf.y-(c.y*16), z:pf.z-(c.z*16)};
	
};




//returns true if p1 is one of the 26 blocks around p0 also returns true if isEqualTo 
SpatialCognizance.prototype.isNextTo=function(p0, p1, ignoreY){

	var b0=positionToBlockCoord(p0);
	var b1=positionToBlockCoord(p1);
	
	if(Math.abs(b1.x-b0.x)>1)return false;
	if(Math.abs(b1.z-b0.z)>1)return false;
	
	if(!ignoreY){
		if(Math.abs(b1.y-b0.y)>1)return false;
	}
	return true;
};

SpatialCognizance.prototype.isEqualTo=function(p0, p1, ignoreY){

	var b0=positionToBlockCoord(p0);
	var b1=positionToBlockCoord(p1);
	
	if(Math.abs(b1.x-b0.x)>0)return false;
	if(Math.abs(b1.z-b0.z)>0)return false;
	
	if(!ignoreY){
		if(Math.abs(b1.y-b0.y)>0)return false;
	}
	return true;
};
SpatialCognizance.prototype.floorPositionsAlongWidePath=function(r, p0, p1){
	var me=this;
	if(r>0.7){
		throw new Exception('path radius is too big: '+r+', max=0.7'); //worst case, if slope = 1, then max r = Math.sqrt(2)/2 
	}
	
	
	var tangents=path2DContraintPaths(r, p0, p1);
	//console.log('Contraint Lines: '+JSON.stringify(tangents));
	
	
	var coords=me.positionListUnion(
			//me.scog.floorPositionsAlongPath(s, p), 
			me.floorPositionsAlongPath(tangents[0][0], tangents[0][1]), 
			me.floorPositionsAlongPath(tangents[1][0], tangents[1][1])
			);
	
	coords.sort(function(a,b){
		
		var da=Math.sqrt(Math.pow(a.x-p0.x,2)+Math.pow(a.z-p0.z,2));
		var db=Math.sqrt(Math.pow(b.x-p0.x,2)+Math.pow(b.z-p0.z,2));
		
		a.d=da;
		b.d=db;
		
		return da-db;
	});


	return coords;

};
//an array of blocks along path defined by p0, p1, ordered by distance to p0.
SpatialCognizance.prototype.floorPositionsAlongPath=function(p0, p1){
	var me=this;
	
	var dx=p1.x-p0.x;
	var dz=p1.z-p0.z;
	
	var b0=me.findFloor(p0);
	var b1=me.findFloor(p1);
	
	
	
	if(me.isEqualTo(b0, b1, true)){
		return [b0];
	}
	
	//strait line, is also easy
	if(dx==0||dz==0){
		
		var mx=dx==0?0:dx/Math.abs(dx);
		var mz=dz==0?0:dz/Math.abs(dz);
		
		var b=b0;
		var coords=[];
		while(!me.isEqualTo(b, b1, true)){
			
			coords.push(b);
			var bn={x:b.x+mx, y:b.y, z:b.z+mz};
			b=me.findFloor(bn); //move to next by adding 1.0 to either x or z. 
			
		}
		coords.push(b1);
		return coords;
	}
	
	var coords=[];
	var b=b0;
	
	//var limit=10;
	while(!me.isEqualTo(b, b1, true)){
		coords.push(b);
		var p=path2DExitsBlockAt(b, p0, p1);
		if(p.x==b.x){
			//exits left
			b=me.findFloor({x:b.x-1, y:b.y, z:b.z});
			
		}else if(p.x==b.x+1){
			
			b=me.findFloor({x:b.x+1, y:b.y, z:b.z});
			
		}else if(p.z==b.z){
			
			b=me.findFloor({x:b.x, y:b.y, z:b.z-1});
			
		}else if(p.z==b.z+1){
			
			b=me.findFloor({x:b.x, y:b.y, z:b.z+1});
			
		}else{
			console.log('Error '+JSON.stringify(b)+' '+JSON.stringify(p));
			break;
			
		}
		
		//if(!(--limit))break;
	}

	return coords;
	
};

SpatialCognizance.prototype.hasBlock=function(p){
	var me=this;
	var c=me.calcChunk(p);
	var chunk=me.getChunk(c.x, c.y, c.z);
	if(chunk===false){
		return false;
	}
	return true;
};

SpatialCognizance.prototype.positionListContains=function(list, p){
	
	
	for(var i=0;i<list.length;i++){
		if(list[i].x==p.x&&list[i].z==p.z&&list[i].y==p.y){
			return true;
		}	
	}
	return false;	
}

SpatialCognizance.prototype.positionListUnion=function(){
	
	var coords=[];
	for(var j=0;j<arguments.length;j++){
		(function(a){
			
			a.forEach(function(b){
				
				for(var i=0;i<coords.length;i++){
					if(coords[i].x==b.x&&coords[i].z==b.z&&coords[i].y==b.y){
						return;
					}
				}
				coords.push(b);
				
			});
			
			
		})(arguments[j]);
		
		
	}

	return coords;

};
SpatialCognizance.prototype.blockAt=function(p){
	var me=this;
	var c=me.calcChunk(p);
	var o=me.calcOffset(p);
	
	var chunk=me.getChunk(c.x, c.y, c.z);
	if(chunk===false){
		console.log(JSON.stringify(['missing chunk', c, o, p]));
		//console.log(new Error().stack);
		return false;
	}
	if(chunk===null){
		console.log(JSON.stringify(['null (air) chunk',c, o, p]));
		//console.log((new Error('')).stack);
		return {id:0, data:0, p:{x:p.x, y:p.y, z:p.z}}; //air
	}

	
	var block=me.calcBlockFromData(o, chunk);
	
	return {id:block.id, data:block.meta, p:{x:p.x, y:p.y, z:p.z}};
	
	//var block=chunk[o.y][o.z][o.x];
	//console.log(JSON.stringify(['block', c, o, p]));
	//return {id:block[0], data:block[1], p:{x:p.x, y:p.y, z:p.z}};
};

/**
 * returns an array of blocks that are within r of p (one block is 1x1x1),
 * currently this assumes r<0.5, and max 4 blocks.
 * 
 * uses a square radius, r defines a square with sides 2r
 * 
 */
SpatialCognizance.prototype.positionListColumnSliceAt=function(p, r){
	var me=this;

	var bounds=[{x:p.x-r, y:p.y, z:p.z-r}, {x:p.x+r, y:p.y, z:p.z-r}, {x:p.x+r, y:p.y, z:p.z+r}, {x:p.x,y:p.y, z:p.z+r}];
	var coords=[];
	
	bounds.forEach(function(p){
		b=positionToBlockCoord(p);
		for(var i=0;i<coords.length;i++){
			if(me.isEqualTo(coords[i], p, true)){
				return;
			}
		}
		coords.push(b);
	});
	
	return coords;
};
SpatialCognizance.prototype.floorNeighbours=function(p){
	var me=this;
	return me.floorListColumnSliceAt(p, 1);
}
SpatialCognizance.prototype.floorListColumnSliceAt=function(p, r){
	var me=this;
	var coords=[];
	me.positionListColumnSliceAt(p, r).forEach(function(p){
		coords.push(me.findFloor(p));
	});
	return coords;
};


SpatialCognizance.prototype.getChunk=function(x,y,z){
	var me=this;
	if(me._chunks===undefined){
		return false;
	}
	
	if(me._chunks['x'+x]===undefined){
		return false;
	}
	
	if(me._chunks['x'+x]['y'+y]===undefined){
		return false;
	}
	
	if(me._chunks['x'+x]['y'+y]['z'+z]===undefined){
		return false;
	}
	
	return me._chunks['x'+x]['y'+y]['z'+z];
};

SpatialCognizance.prototype.list=function(){
	
	var me=this;
	
	var size=0;
	
	Object.keys(me._chunks).forEach(function(k){
		
		size+=(Object.keys(me._chunks[k]).length);
		
	});
	console.log(size+' chunk colums');
	console.log((size*16)+' chunk colums');
	console.log(size*(Math.pow(16,4))+' total blocks');
	
	
}

SpatialCognizance.prototype.updateBlock=function(p,d){
	var me=this;
	var c=me.calcChunk(p);
	var o=me.calcOffset(p);
	
	
	var chunk=me.getChunk(c.x, c.y, c.z);
	if(chunk===false){
		//throw new Error('missing chunk: '+JSON.stringify([c, o, p]));
		return;
	}
	if(chunk===null){
		//throw new Error('(null) air chunk: '+JSON.stringify([c, o, p]));
		return;
	}
	
	//var last=chunk[o.y][o.z][o.x];
	//chunk[o.y][o.z][o.x]=d;
	me.writeDataFromBlock(o, d, chunk);
	me.emit('block.update', p);

	
}
SpatialCognizance.prototype.setChunk=function(x, y, z, chunk){
	
	var me=this;
	if(me._chunks===undefined){
		me._chunks={};
		me._countChunks=0;
	}
	
	if(me._chunks['x'+x]===undefined){
		me._chunks['x'+x]={};
	}
	
	if(me._chunks['x'+x]['y'+y]===undefined){
		me._chunks['x'+x]['y'+y]={};
	}
	
	me._chunks['x'+x]['y'+y]['z'+z]=chunk;
	me._countChunks++;
	
};

SpatialCognizance.prototype.chunkCount=function(){
	var me=this;
	return me._countChunks||0;
};

SpatialCognizance.prototype.clearChunk=function(x, y, z){
	var me=this;
	if(me._chunks===undefined){
		return;
	}
	
	if(me._chunks['x'+x]===undefined){
		return;
	}
	
	if(me._chunks['x'+x]['y'+y]===undefined){
		return;
	}
	
	if(me._chunks['x'+x]['y'+y]['z'+z]===undefined){
		return;
	}
	
	delete me._chunks['x'+x]['y'+y];
	me._countChunks--;
	
	if(Object.keys(me._chunks['x'+x]['y'+y]).length==0){
		delete me._chunks['x'+x]['y'+y];
	}
	
	if(Object.keys(me._chunks['x'+x]).length==0){
		delete me._chunks['x'+x];
	}
};

SpatialCognizance.prototype.findSolid=function(pos, opts){
	var me=this;
	var p=positionToBlockCoord(pos);
	
	if(!me.hasBlock(p)){
		throw new Error('findSolid() data does not exist (chunk not loaded?) at {x:'+p.x+', y:'+p.y+', x:'+p.z+'}');
	}
	while(!me.blockIsSolid(me.blockAt(p))){
		p={x:p.x, y:p.y-1, z:p.z}
	}

	return {x:p.x,y:p.y,z:p.z};
}


//get the next floor block searching up if their are solid blocks at or within 2 above y, 
//or down if y y+1 and y+2 are air
SpatialCognizance.prototype.findFloor=function(pos, opts){

	// return x, y, z if x, y, z is solid, and 2 block above are
	// air. otherwise increment y and repeat
	var me=this;
	
	
	
	var p=me.findSolid(pos);
	var py=p.y; //remember start
	p.y--; //
	
	//console.log(JSON.stringify(p)+' '+me.idToString(me.blockAt(p)));
	
	
	var c=0;
	var blocks=[null, null, null];
	
	var cursor=function(a){
		var cur=a%3;
		if(cur<0)return 3-cur;
		return cur;
	};
	
	var block=function(a){
		return blocks[cursor(a)];
	};
	
	do{
		
		if(!me.hasBlock(p)){
			throw new Error('findFloor() data does not exist (chunk not loaded?) at {x:'+p.x+', y:'+p.y+', x:'+p.z+'}');
		}
		//console.log(JSON.stringify(p)+' '+me.idToString(me.blockAt(p)));
		
		blocks[cursor(c)]=block(c)===null?me.blockAt(p):block(c);
		blocks[cursor(c+1)]=block(c+1)===null?me.blockAt({x:p.x, y:p.y+1, z:p.z}):block(c+1);
		blocks[cursor(c+2)]=block(c+2)===null?me.blockAt({x:p.x, y:p.y+2, z:p.z}):block(c+2);
		
		
		if(block(c)===false){
			throw new Error('findFloor() block '+p.y+' is false at {x:'+p.x+', x:'+p.z+'}');
		}
		
		
		
		var isAir0=!me.blockIsSolid(block(c));
		var isAir1=!me.blockIsSolid(block(c+1));
		var isAir2=!me.blockIsSolid(block(c+2));
		//console.log(JSON.stringify([me.idToString(block(c)), me.idToString(block(c+1)), me.idToString(block(c+2))]));
		
		if(((!isAir0) && isAir1 && isAir2)){
			// bottom block is not air, but the rest are. a normal use-able floor block at (x,y,z)
			return {x:p.x,y:p.y,z:p.z};
		}
		
		if(isAir0 && isAir1 && isAir2){
			// all three blocks are air go down
			blocks[cursor(c+2)]=null;
			p.y--;
			c--;
			
		}else{
			// one of y+1, or y+2 was solid continue to look up.
			blocks[cursor(c)]=null;
			p.y++;
			c++;
			
			
		}

	
	}while(p.y>=0);
	
	throw new Exception('findFloor() could not find floor: '+py+' to '+p.y+' at {x:'+p.x+', x:'+p.z+'}');
};


SpatialCognizance.prototype.blockIsSolid=function(block){
	
	var me=this;
	var code=me.idToCode(block);
	
	//console.log(code);
	
	switch(code){
	
		case 'minecraft:air':
		case 'minecraft:sapling':
		case 'minecraft:web':
		//case 'minecraft:grass': //oops this is solid it is the same as dirt. just green on top
		case 'minecraft:tallgrass':
		case 'minecraft:yellow_flower':
		case 'minecraft:red_flower':
		case 'minecraft:brown_mushroom':
		case 'minecraft:red_mushroom':
		case 'minecraft:torch':
		case 'minecraft:redstone_wire':
		case 'minecraft:wheat':
		case 'minecraft:standing_sign':
		case 'minecraft:rail':	
		
		case 'minecraft:flowing_water':
		case 'minecraft:water':

		case 'minecraft:wall_sign':
		case 'minecraft:lever':
		case 'minecraft:stone_pressure_plate':

		case 'minecraft:wooden_pressure_plate':
		case 'minecraft:unlit_redstone_torch':
		
		case 'minecraft:redstone_torch':
		case 'minecraft:stone_button':
		case 'minecraft:reeds':
		case 'minecraft:unpowered_repeater':
		case 'minecraft:powered_repeater':
		
		
		case 'minecraft:pumpkin_stem':
		case 'minecraft:melon_stem':
		case 'minecraft:vine':
		
		
		case 'minecraft:nether_wart':
		case 'minecraft:carpet':
		case 'minecraft:double_plant':
			return false;
			break;
		//should check for openness?		
		case 'minecraft:trapdoor':	
		case 'minecraft:fence_gate':
			
		
			
		case 'minecraft:iron_door':
		case 'minecraft:wooden_door':
		case 'minecraft:spruce_door':
		case 'minecraft:birch_door':
		case 'minecraft:jungle_door':
		case 'minecraft:acacia_door':
		case 'minecraft:dark_oak_door':
			
				return !me.doorIsOpen(block)
	
	default:return true;
	
	}

	
};



SpatialCognizance.prototype.doorIsOpen=function(block){
	var me=this;
	
	var code=me.idToCode(block);
	
	switch(code){
	
	case 'minecraft:iron_door':
	case 'minecraft:wooden_door':
	case 'minecraft:spruce_door':
	case 'minecraft:birch_door':
	case 'minecraft:jungle_door':
	case 'minecraft:acacia_door':
	case 'minecraft:dark_oak_door':
		break;
		
	default: throw new Error('not a door '+JSON.stringify(block));
	
	}
	
	var top;
	var bottom;
	
	var above=me.blockAt({x:block.p.x, y:block.p.y+1, z:block.p.z});
	if(me.idToCode(above)==code){
		
		top=above
		bottom=block
		
	}else{
		
		var below=me.blockAt({x:block.p.x, y:block.p.y-1, z:block.p.z})
		if(me.idToCode(below)==code){
			
			top=block;
			bottom=below;
			
		}else{
			throw new Error('invalid door block above/below');
		}
		
	}
	
	if(bottom.data&0x4){
		console.log('door is open');
		return true;
	}
	console.log('door is closed');
	return false;
	
	//process.exit(0);
}


/**
 * returns an array of rows, (odd number) with each row containing x cells, the center row and center cell 
 * will contain the block for pos. 
 */
SpatialCognizance.prototype.floorplan=function(pos, options){
	var me=this;

	var opts={
		size:31
	};
	
	if(opts.size5%2!==1){
		//floorplan needs to have odd size for center
	}
	
	var a=[];//array for rows
	for(var i=0;i<opts.size;i++){
		a.push([]);//init row
	}
	var center=Math.floor(opts.size/2);
	
	var p={x:Math.floor(pos.x), y:Math.floor(pos.y), z:Math.floor(pos.z)};
	p=me.findFloor(p); // center block - player is standing on
	if(p===false){
		throw 'floor unavailable';
	}
	var b=me.blockAt(p);
	//[z][x]
	a[center][center]=b;

	//square radius away
	for(var s=1;s<=center;s++){
		(function(s){
			
			var pc;  // position current
			var pb;   // block current
			var ny;  // neighbor y
			
			
			
			//top left
			//top row
			for(var x=(-s); x<=s-1; x++){
				
				
				ny=a[center-s+1][x==-s?center+x+1:center+x].p.y;
				
				pc=me.findFloor({x:pos.x+x, y:ny, z:pos.z-s}); //use neighbor elevation
				pb=me.blockAt(pc);
				a[center-s][center+x]=pb;
		
			}
			
			//top right
			//right column
			for(var z=(-s); z<=s-1; z++){
				
				
				ny=a[z==-s?center+z+1:center+z][center+s-1].p.y;
				
				pc=me.findFloor({x:pos.x+s, y:ny, z:pos.z+z}); //use neighbor elevation
				pb=me.blockAt(pc);
				a[center+z][center+s]=pb;
		
			}
			
			//bottom right
			//bottom row,  right to left
			for(var x=s; x>=(-s)+1; x--){
				
				ny=a[center+s-1][x==s?center+x-1:center+x].p.y;
				
				pc=me.findFloor({x:pos.x+x, y:ny, z:pos.z+s}); //use neighbor elevation
				pb=me.blockAt(pc);
				
				
				a[center+s][center+x]=pb;		
				//console.log((center+s)+' : '+JSON.stringify(a[center+s]));
			}
			
			//bottom left
			//left column, bottom to top
			for(var z=s; z>=(-s)+1; z--){

				ny=a[z==s?center+z-1:center+z][center-s+1].p.y;
				
				pc=me.findFloor({x:pos.x-s, y:ny, z:pos.z+z}); //use neighbor elevation
				pb=me.blockAt(pc);
				a[center+z][center-s]=pb;
		
			}
			
			
		})(s);
	}

	return a;
	
};

SpatialCognizance.prototype.coordsToFloorplan=function(coords){
	
	var minx=null, minz=null, maxx=null, maxz=null;
	
	coords.forEach(function(b){
		
		if(minx===null||b.x<minx)minx=b.x;
		if(minz===null||b.z<minz)minz=b.z;
		if(maxx===null||b.x>maxx)maxx=b.x;
		if(maxz===null||b.z>maxz)maxz=b.z;
		
	});
	
	var floorplan=[];
	
	
	for(var i=0;i<=maxz-minz;i++){
		floorplan.push([]);
		for(var j=0;j<=maxx-minx;j++){
			floorplan[i].push(null);
		}
	}
	
	//console.log(JSON.stringify(floorplan));
	coords.forEach(function(b){
		//console.log(JSON.stringify([b.z-minz, b.x-minx]));
		floorplan[b.z-minz][b.x-minx]=b;
		
	});
	
	return floorplan;
};

SpatialCognizance.prototype.printFloorplan=function(f, fmt, prnt){
	var me=this;
	
	var log=prnt===undefined?console.log:prnt;
	var format=fmt===undefined?function(b, x, z){
		if(b==null)return '[ ]';
		return '['+(me.idToString(me.blockAt(b))).substring(0,1)+']';
	
	}:fmt;
	
	f.forEach(function(row, z){
		
		var line='';
		
		row.forEach(function(block, x){
			
			line+=format(block, x, z);
			
		});
		
		log(line);
		
	});
	
};




//calculate the world position where a path (p0 to p1) intersect (exits) b0
function path2DExitsBlockAt(b0, p0, p1){
	var fn=path2DFunctions(p0, p1);

	if(fn.dx<0){
		return path2DEntersBlockAt(b0, p1, p0);
		
	}
	
	//now dx always positive
	if(fn.dx==0){
		if(p1.z-p0.z>0){
		
			return {x:p0.x, y:b0.y, z:b0.z+1};
		}
	
		return {x:p0.x, y:b0.y, z:b0.z};
	}

	if(fn.dz==0){
		
		return {x:b0.x+1, y:b0.y, z:p0.z};
	
	}

	var z=fn.fx(b0.x+1);
	if(z<b0.z){
	
		return {x:fn.fz(b0.z), y:b0.y, z:b0.z};
		
	}else if(z>b0.z+1){

		return {x:fn.fz(b0.z+1), y:b0.y, z:b0.z+1};
	}else{
		
		return {x:b0.x+1, y:b0.y, z:z};
	}
	
};

//calculate the world position where a path (p0 to p1) intersect (enters) b0
//always returns the y value in b0
function path2DEntersBlockAt(b0, p0, p1){

	
	var fn=path2DFunctions(p0, p1);
	
	if(fn.dx<0){
		return path2DExitsBlockAt(b0, p1, p0);
	}
	
	//now dx always positive so that the enter position can only be in top left or bottom
	
	
	
	if(fn.dx==0){
		//purely verticle (pretending z is vertical axis)
		return {x:p0.x, y:b0.y, z:b0.z+(p1.z-p0.z>0?0:1)};

	}

	if(fn.dz==0){
		//purely horizontal (pretending x is horizontal axis)
		return {x:b0.x, y:b0.y, z:p0.z};
	}
	
	var z=fn.fx(b0.x); // m*b0.x+b;
	if(z<b0.z){
		//enters from below
		return {x:fn.fz(b0.z), y:b0.y, z:b0.z};	
	}else if(z>b0.z+1){
		//enters from above
		return {x:fn.fz(b0.z+1), y:b0.y, z:b0.z+1};
	}else{
		//enters from left
		return {x:b0.x, y:b0.y, z:z};
	}
	
};

//returns the Point x,z (y is ingored, set to b0.y) which is the center point of the path entering and exiting
function path2DIntersectsBlockAt(b0, p0, p1){
	
	var i0=path2DEntersBlockAt(b0, p0, p1);
	var i1=path2DExitsBlockAt(b0, p0, p1);
	
	return {x:i0.x+(i1.x-i0.x)/2, y:b0.y, z:i0.z+(i1.z-i0.z)/2};
}

/*
 * returns and object with:
 * fx a function that takes x and produces z  //not returned if vertical line
 * fz a function that takes z and produces x //not returned if horizontal line
 * 
 *	//note: the argument to fx is ignored if horizontal line
 *	//note: the argument to fz is ignored if verticle line
 * 
 * dx p1.x-p0.x
 * dz p1.z-p0.z
 * slope dz/dx //not returned if horizontal or vertical line
 * offset fx(p0.x) //not returned if horizontal or vertical line
 * 
 */
function path2DFunctions(p0, p1){
	
	if(p0.fx||p0.fz)return p0; //pass though;	


	if(p0.x==p1.z&&p0.z==p1.z)throw new Exception('path2DFunctions Expects two distinct points p0, p1');
	
	var dx=p1.x-p0.x;
	var dz=p1.z-p0.z;
	
	if(dx==0){
		var x=p0.x;
		
		var theta=dz>0?Math.PI/2:-Math.PI/2;
		
		return {
			//there is no fx, ie: division by 0 calculating slope
			fz:function(){
				return x;
			},
			dx:dx,
			dz:dz,
			theta:theta
		};
	}
	
	
	if(dz==0){
		var z=p0.z;
		var theta=dx>0?0:-Math.PI;
		return {
			//there is no fy ie: division by 0 calculating fz, slope (m) = 0, and x=(z-b)/m 
			fx:function(x){
				return z;
			},
			dx:dx,
			dz:dz,
			theta:theta
		};
	}
	
	
	
	var m=dz/dx;
	var b=p0.z-m*p0.x;
	
	var theta=Math.atan(m);
	
	return {
		fx:function(x){
			return m*x+b;
		}, 
		fz:function(z){
			return (z-b)/m;
		},
		dx:dx,
		dz:dz,
		slope:m,
		offset:b,
		theta:theta
	};
	
};


function path2DDistanceAtPoint(p, p0, p1){
	//don't need p1
	return Math.sqrt(Math.pow(p.x-p0.x,2)+Math.pow(p.z-p0.z,2));
};


function path2DFractionAtPoint(p, p0, p1){
	return path2DDistanceAtPoint(p, p0, p1)/path2DDistance(p0,p1);
};

function path2DFractionAtDistance(d, p0, p1){
	return d/path2DDistance(p0,p1);
};

function path2DPointAtFraction(f, p0, p1){
	var dx=p1.x-p0.x;
	var dz=p1.z-p0.z;
	
	return {x:p0.x+f*dx, y:p0.y, z:p0.z+f*dz};
	
};

function path2DPointAtDistance(d, p0, p1){
	return path2DPointAtFraction(path2DFractionAtDistance(d, p0,p1) ,p0, p1);
};

function path2DDistance(p0, p1){
	return Math.sqrt(Math.pow(p1.x-p0.x,2)+Math.pow(p1.z-p0.z,2));
};

function positionToBlockCoord(p){
	return {x:Math.floor(p.x), y:Math.floor(p.y), z:Math.floor(p.z)};
};


function chunkToPosition(chunk, offset){
	
	return {x:chunk.x*16 + offset.x, y:chunk.y*16 + offset.y, z:chunk.z*16 + offset.z};
	
};

/*
 * returns an array with 2 arrays , [[p00, p01], [p10, p11]] with each of the two array define start end points for tangential paths 
 * around p0, p1 constrain paths can be used to detect boundary colisions that would be unnoticed by a single path.
 * r defines the tangential distance from [p0,p1] to each of the two parrallel lines
 */
function path2DContraintPaths(r, p0, p1){
	var fn=path2DFunctions(p0, p1);
	if(fn.dx==0){
		return [
		        [{x:p0.x, y:p0.y, z:p0.z-r},{x:p1.x, y:p1.y, z:p1.z-r}], 
		        [{x:p0.x, y:p0.y, z:p0.z+r},{x:p1.x, y:p1.y, z:p1.z+r}]
		        ];
	}
	
	if(fn.dz==0){
		return [
		        [{x:p0.x-r, y:p0.y, z:p0.z},{x:p1.x-r, y:p1.y, z:p1.z}], 
		        [{x:p0.x+r, y:p0.y, z:p0.z},{x:p1.x+r, y:p1.y, z:p1.z}]
		        ];
	}
	
	if(fn.dx<0){
		var pnts=path2DContraintPaths(r, p1, p0);
		return [[pnts[0][1], pnts[0][0]], [pnts[1][1],pnts[1][0]]]; //swap start and end points for each
	}
	
	
	var theta=Math.atan(fn.slope);
	var x=r*Math.sin(theta);
	var z=r*Math.cos(theta);
	
	return [
	        	[{x:p0.x+x, y:p0.y, z:p0.z-z},{x:p1.x+x, y:p1.y, z:p1.z-z}], 
	        	[{x:p0.x-x, y:p0.y, z:p0.z+z},{x:p1.x-x, y:p1.y, z:p1.z+z}]
	       ];
	
	
}


/*
 * returns true if the point is on the path within 0.001
 * note: path extends beyond p0 and p1
 */
function path2DContainsPoint(p, p0, p1){
	
	var fn=path2DFunctions(p0, p1);
	if(fn.fx){
		if(Math.round((fn.fx(p.x)-p.z)*1000)==0)return true;
	}
	
	if(fn.fz){
		if(Math.round((fn.fz(p.z)-p.z)*1000)==0)return true;
	}
	throw new Exception('fn did not contain one of fx, or fz');
};

function path2DContainsPointInBounds(p, p0, p1){
	
	if(path2DContainsPoint(p, p0, p1)){
		if((p.x>=p0.x&&p.x<=p1.x)||(p.x>=p1.x&&p.x<=p0.x)){
			if((p.z>=p0.z&&p.z<=p1.z)||(p.z>=p1.z&&p.z<=p0.z)){
				return true;
			}
		}
	}
	return false;
};

	


function path2DPathsAreParallel(pth0, pth1){

	var fn0=path2DFunctions(pth0[0], pth0[1]);	
	var fn1=path2DFunctions(pth1[0], pth1[1]);	

	if(Math.round((fn0.slope-fn1.slope)*1000)==0)return true
	return false;

}

function path2DPathsIntersectAt(pth0, pth1){

	var fn0=path2DFunctions(pth0[0], pth0[1]);	
	var fn1=path2DFunctions(pth1[0], pth1[1]);	

	if(path2DPathsAreParallel(fn0, fn1)){
		return false;
	}

	if(fn0.slope!==undefined&&fn1.slope!==undefined){
	
		//y1=m1x+b1
		//y2=m2x+b2

		//m1x+b1=m2x+b2

		//m1x-m2x=b2-b1
		//x(m1-m2)=b2-b1
		//x=(b2-b1)/(m1-m2)

		var x=(fn1.offset-fn0.offset)/(fn0.slope-fn1.slope);
		var z=fn0.fx(x);

		return {x:x, z:z};

	}

	var x=null;
	var z=null;
	if(fn0.fz===undefined){
		z=fn0.fx();
	}
	if(fn0.fx===undefined){
		x=fn0.fz();
	}
	if(fn1.fz===undefined){
		z=fn1.fx();
	}
	if(fn1.fx===undefined){
		x=fn1.fz();
	}

	return {x:x, z:z};
}

function point3DMeasure(p0, p1){
	
	return Math.sqrt(Math.pow(p1.x-p0.x,2) + Math.pow(p1.y-p0.y,2) + Math.pow(p1.z-p0.z,2));
	
}

module.exports = {
		
		createSpatialCognizance: createSpatialCognizance,
		math:{
			
			point3DMeasure:point3DMeasure,
			
			path2DEntersBlockAt:path2DEntersBlockAt,
			path2DExitsBlockAt:path2DExitsBlockAt,
			path2DIntersectsBlockAt:path2DIntersectsBlockAt,
			
			positionToBlockCoord:positionToBlockCoord,
			chunkToPosition:chunkToPosition,
			
			
			path2DDistanceAtPoint:path2DDistanceAtPoint,
			path2DFractionAtPoint:path2DFractionAtPoint,
			path2DFractionAtDistance:path2DFractionAtDistance,
			path2DPointAtFraction:path2DPointAtFraction,
			path2DPointAtDistance:path2DPointAtDistance,
			path2DDistance:path2DDistance,
			path2DContraintPaths:path2DContraintPaths,
			path2DFunctions:path2DFunctions,
			path2DPathsAreParallel:path2DPathsAreParallel
		
		}
				
};




