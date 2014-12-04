
module.exports = {
		createEntityCognizance: createEntityCognizance
};


function createEntityCognizance(client){
	
	var ecog=new EntityCognizance();	
	
	
	client.on('named_entity_spawn',function(data){
			ecog.addEntity(data.entityId, {x:data.x, y:data.y, z:data.z, pitch:data.pitch, yaw:data.yaw}, 'player');
	});
	
	client.on('spawn_entity',function(data){
			//ecog.addEntity(data.entityId);
		
		var type=objectTypeIdToString(data.type);
		
		//console.log('spawn_entity: '+type);
		ecog.addEntity(data.entityId, {
			x:data.x, y:data.y, z:data.z, pitch:data.pitch, yaw:data.yaw, 
		}, type.toLowerCase().replace(' ','_'));
	});
	
	client.on('spawn_entity_living',function(data){
		
		var type=mobTypeIdToString(data.type);
		
		//console.log('spawn_entity_living: '+type);
		ecog.addEntity(data.entityId, {
			x:data.x, y:data.y, z:data.z, pitch:data.pitch, yaw:data.yaw, 
			headPitch:data.headPitch,
			vx:data.velocityX, vy:data.velocityY, vz:data.velocityZ
			}, type.toLowerCase().replace(' ','_'));
	});
	
	client.on('entity_velocity',function(data){
		ecog.updateEntityVelocity(data.entityId, { vx:data.velocityX/32.0, vy:data.velocityY/32.0, vz:data.velocityZ/32.0});
	});
	
	
//	client.on('spawn_entity_painting',function(data){
//	}); //don't care
	
	client.on('spawn_entity_experience_orb',function(data){
	});
	
	
	
	client.on('rel_entity_move',function(data){
		ecog.updateEntityPosition(data.entityId, {x:data.dX/32.0, y:data.dY/32.0, z:data.dZ/32.0}, true);
	});
	
	client.on('entity_move_look',function(data){
		ecog.updateEntityPosition(data.entityId, {x:data.dX/32.0, y:data.dY/32.0, z:data.dZ/32.0}, true);
	});
	
	client.on('entity_teleport',function(data){
		ecog.updateEntityPosition(data.entityId, {x:data.x/32.0, y:data.y/32.0, z:data.z/32.0});
		//console.log(JSON.stringify(data));
	});
	
	client.on('entity_destroy',function(data){
		for(var i=0;i<data.count;i++){
			ecog.removeEntity(data.entityIds[i]);
		}
	});
	
	
	ecog.setMortalEnemies(['creeper', 'zombie', 'skeleton', 'spider', 'cave_spider']);
	
	return ecog;
	
}

var events=require('events');
function EntityCognizance(){
	events.EventEmitter.call(this); 
	var me=this;
	
	me._entityIds=[];
	me._entityTraits=[];
	me._entityActions=[];
	me._entityAssets=[];
	me._entityPositions=[];
	me._entityTypes=[];
	me._entityVelocities=[];
	
	
	me._m_enemies=[];
	
}

EntityCognizance.prototype.__proto__ = events.EventEmitter.prototype;

EntityCognizance.prototype.hasEntity=function(id){
	var me=this;
	return (me._idx(id)>=0)?true:false;
};

EntityCognizance.prototype._idx=function(id){
	var me=this;
	return me._entityIds.indexOf(id);
};

EntityCognizance.prototype.entityIs=function(id, traitName){
	//var me=this;

	return false;
};

EntityCognizance.prototype.entityHas=function(id, assetName){
	//var me=this;
};

EntityCognizance.prototype.entityDoes=function(id, actionName){
	//var me=this;
};

EntityCognizance.prototype.addEntity=function(id, position, type){
	var me=this;
	if(me.hasEntity(id)){
		console.log('already has '+id);
	}
	
	me._entityIds.push(id);
	me._entityTraits.push({});
	me._entityActions.push({});
	me._entityAssets.push({});
	me._entityPositions.push(position);
	me._entityTypes.push(type||null);
	me._entityVelocities.push({});
	
	me.emit('detect', id, type);
	
	if(type){
		me.emit('detect.'+type, id);
		
		if(me._m_enemies.indexOf(type)>=0){
			me.emit('detect.enemy', id, type);
		}
		
		
		
		
	}else{
		me.emit('detect.unkown', id, 'unknown');
	}
};


EntityCognizance.prototype.removeEntity=function(id){
	var me=this;
	if(!me.hasEntity(id))return;
	var i=me._idx(id);
	
	var type=me._entityTypes[i];
	
	
	me._entityIds.splice(i,1);
	me._entityTraits.splice(i,1);
	me._entityActions.splice(i,1);
	me._entityAssets.splice(i,1);
	me._entityPositions.splice(i,1);
	me._entityTypes.splice(i,1);
	me._entityVelocities.splice(i,1);
	
	me.emit('lose', id);
	
	if(type){
		me.emit('lose.'+type, id);
	}else{
		me.emit('lose.unkown', id);
	}
};
EntityCognizance.prototype.updateEntityVelocity=function(id, velocity){
	var me=this;
	if(me.hasEntity(id)){
		var i=me._idx(id);
		var last=me._entityVelocities[i];
		var current={
				vx:velocity.vx, 
				vy:velocity.vy, 
				vz:velocity.vz, 
			};
		me._entityVelocities[i]=current;
		if(!(last.x==current.x&&last.y==current.y&&last.z==current.z)){
			me.emit('update.velocity.'+id, {vx:current.vx, vy:current.vy, vz:current.vz}, last);
		}
		
		return last;
	}
	return false;
};

EntityCognizance.prototype.updateEntityPosition=function(id, position, rel){
	var me=this;
	if(me.hasEntity(id)){
		var i=me._idx(id);
		var last=me._entityPositions[i];
		var current=rel?{
				x:last.x+position.x, 
				y:last.y+position.y, 
				z:last.z+position.z, 
				yaw:last.yaw, 
				pitch:last.pitch
			}:{
				x:position.x, 
				y:position.y, 
				z:position.z, 
				yaw:last.yaw, 
				pitch:last.pitch
			};
		me._entityPositions[i]=current;
		if(!(last.x==current.x&&last.y==current.y&&last.z==current.z)){
			me.emit('update.position.'+id, {x:current.x, y:current.y, z:current.z, yaw:current.yaw, pitch:current.pitch}, last);
		}
		
		if(!(last.yaw==current.yaw&&last.pitch==current.pitch)){
			me.emit('update.look.'+id, {x:current.x, y:current.y, z:current.z, yaw:current.yaw, pitch:current.pitch}, last);
		}
		
		return last;
	}
	return false;
};

EntityCognizance.prototype.getEntityPosition=function(id){
	var me=this;
	if(me.hasEntity(id)){
		var p=me._entityPositions[me._idx(id)];
		return {x:p.x, y:p.y, z:p.z, pitch:p.pitch, yaw:p.yaw, };
	}
	return false;
};

/*
 * watch an items position. 
 */
EntityCognizance.prototype.watch=function(id, update, after, time){
	var me=this;
	
	var f=function(pos){
		update(pos);
	};
	me.on('update.position.'+id, f);
	
	setTimeout(function(){
		me.removeListener('update.position.'+id, f);
		after();
	},time);
	update(me.getEntityPosition(id));
	return me;
};

EntityCognizance.prototype.setMortalEnemies=function(e){
	var me=this;
	me._m_enemies=e;
};


function mobTypeIdToString(id){
	
	
//	48	Mob	N/A	N/A
//	49	Monster	N/A	N/A
	
	switch(id){
	

	
	case 50:	return 'Creeper'; //0.6	1.8
	case 51:	return 'Skeleton'; //	0.6	1.8
	case 52:	return 'Spider'; //	1.4	0.9
	case 53:	return 'Giant Zombie'; //	3.6	10.8
	case 54:	return 'Zombie'; //	0.6	1.8
	case 55:	return 'Slime'; //	0.6 * size	0.6 * size
	case 56:	return 'Ghast'; //	4	4
	case 57:	return 'Zombie Pigman'; //	0.6	1.8
	case 58:	return 'Enderman'; //	0.6	2.9
	case 59:	return 'Cave Spider'; //	0.7	0.5
	case 60:	return 'Silverfish'; //	0.3	0.7
	case 61:	return 'Blaze'; //	0.6	1.8
	case 62:	return 'Magma Cube'; //	0.6 * size	0.6 * size
	case 63:	return 'Ender Dragon'; //	16.0	8.0
	case 64:	return 'Wither'; //	0.9	4.0
	case 65:	return 'Bat'; //	0.5	0.9
	case 66:	return 'Witch'; //	0.6	1.8
	case 67:	return 'Endermite'; //	0.4	0.3
	case 68:	return 'Guardian'; //	0.85	0.85
	case 90:	return 'Pig'; //	0.9	0.9
	case 91:	return 'Sheep'; //	0.9	1.3
	case 92:	return 'Cow'; //	0.9	1.3
	case 93:	return 'Chicken'; //	0.3	0.7
	case 94:	return 'Squid'; //	0.95	0.95
	case 95:	return 'Wolf'; //	0.6	0.8
	case 96:	return 'Mooshroom'; //	0.9	1.3
	case 97:	return 'Snowman'; //	0.4	1.8
	case 98:	return 'Ocelot'; //	0.6	0.8
	case 99:	return 'Iron Golem'; //	1.4	2.9
	case 100:	return 'Horse'; //	1.4	1.6
	case 101:	return 'Rabbit'; //	0.6	0.7
	case 120:	return 'Villager'; //	0.6	1.8

	default:  return 'unknown:'+id;
	}
};

function objectTypeIdToString(id){
	
	
//	48	Mob	N/A	N/A
//	49	Monster	N/A	N/A
	
	switch(id){

	
	case 1:	'Boat'; //	1.5	0.6
	case 2:	'Item Stack'; // (Slot)	0.25	0.25
	case 10: 'Minecart'; //	0.98	0.7
	//case 11: (unused since 1.6.x)	Minecart (storage)	0.98	0.7
	//case 12: (unused since 1.6.x)	Minecart (powered)	0.98	0.7
	case 50:	return 'Activated TNT'; //	0.98	0.98
	case 51:	return 'EnderCrystal'; //	2.0	2.0
	case 60:	return 'Arrow'; // (projectile)	0.5	0.5
	case 61:	return 'Snowball'; // (projectile)	0.25	0.25
	case 62:	return 'Egg'; // (projectile)	0.25	0.25
	case 63:	return 'FireBall'; // (ghast projectile)	1.0	1.0
	case 64:	return 'FireCharge'; // (blaze projectile)	0.3125	0.3125
	case 65:	return 'Thrown Enderpearl'; //	0.25	0.25
	case 66:	return 'Wither Skull'; // (projectile)	0.3125	0.3125
	case 70:	return 'Falling Objects'; //	0.98	0.98
	case 71:	return 'Item frames'; //	varies	varies
	case 72:	return 'Eye of Ender'; //	0.25	0.25
	case 73:	return 'Thrown Potion'; //	0.25	0.25
	case 74:	return 'Falling Dragon Egg'; //	0.98	0.98
	case 75:	return 'Thrown Exp Bottle'; //	0.25	0.25
	case 76:	return 'Firework Rocket'; //	0.25	0.25
	case 77:	return 'Leash Knot'; //	0.5	0.5
	case 78:	return 'ArmorStand'; //	0.5	2.0
	case 90:	return 'Fishing Float'; //	0.25	0.25
	
	default: return 'unknown:'+id;

}


}
