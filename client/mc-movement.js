
module.exports = {
		createMovement: createMovement
};


function createMovement(client, scog){


	var movement=new Movement(client, scog);	

	return movement;

}

var events=require('events');

var spatial=require('./mc-spatial').math;

function Movement(client, scog){
	
	
	
	var me=this;
	events.EventEmitter.call(me);
	me.client=client;
	me.scog=scog;
	
	me._updateLoop=true;
	me.position={};
	me.position.pitch=0; 		//<--
	me.position.onGround=true;  //<-- also set on first 'position' packet

	client.on('position',function(data){
		
		//console.log('position: '+JSON.stringify(data));
		
		var last={x:me.position.x,y:me.position.y,z:me.position.z};
		
		//flags is a bit field that, for each bit if set indicates that one of the fields
		//is a relative value. otherwise absolute.
		me.position.x=(data.flags&0x01)?me.position.x+data.x:data.x;
		me.position.y=(data.flags&0x02)?me.position.y+data.y:data.y;
		me.position.z=(data.flags&0x04)?me.position.z+data.z:data.z;
		me.position.pitch=(data.flags&0x08)?me.position.pitch+data.pitch:data.pitch;
		me.position.yaw=(data.flags&0x10)?me.position.yaw+data.yaw:data.yaw;
		me.emit('correction', me.position, last);	
		me.emit('move', me.position, last);
	});
	

	client.once('position',function(data){
		
		me.position.pitch=0; //clear any weird head angle
		me.position.onGround=true; //clear not on ground
		
		if(me.interval===undefined){
			
			//var history=[];
			//var hc=0;
			//var hcMax=100;
			
			me.interval=setInterval(function(){
				if(!me._updateLoop)return;
				//client.write('animation', {});
				
				var pos={
						x:Math.round(me.position.x*1000)/1000,
						y:Math.round(me.position.y*1000)/1000,
						z:Math.round(me.position.z*1000)/1000,
						onGround:me.position.onGround
					};
				
				//history[hc]=pos;
				//hc=(hc+1)%hcMax;
				
				client.write('position',pos);
				client.write('look',{
					yaw:Math.round(me.position.yaw*1000)/1000, 
					pitch:Math.round(me.position.pitch*1000)/1000, 
					onGround:me.position.onGround
				});
				
				if(!(me._jumping||me._falling||me._climbing)){
					 
					if(me.position.onGround&&me.scog.hasBlock(me.position)){
						
						var feet=Math.round(me.position.y);
						var floor=-1;
						me.currentFloorPositions().forEach(function(coord){
							floor=Math.max(floor, coord.y);
						});
						
						if(feet-floor>1){
							me.fall(floor+1);
						}else if(feet-floor<1){
							//hmm burried?
						}else{
							
							if(feet-floor>1){
								//me.position.y=Math.round(me.position.y);
							}
						}
		
					}
				}
				
			},50);
			
			me.on('fall',function(s,e){
				
				console.log('started to fall');
				
			});
			
			me.on('fell',function(s,e){
				console.log('landed');
			});
			
			me.on('jump.top',function(){
				console.log('jump '+me.position.y);
			});
			
			
			me.on('correction', function(p, l){
				//console.log(JSON.stringify(history.slice(hc), null, ' '));
				//console.log(JSON.stringify(history.slice(0,hc), null, ' '));
				console.log('correction to '+JSON.stringify({x:p.x,y:p.y,z:p.z})+' from '+JSON.stringify(l));
			});	
			
//			setInterval(function(){
//				
//				if(me.position.onGround){
//					var floor=me.scog.findFloor({x:me.position.x, y:Math.round(me.position.y), z:me.position.z});
//					console.log('pos: '+me.position.y+' floor:'+floor.y+' '+JSON.stringify(me.scog.blockAt(floor)));
//				}
//				
//			},2000);
		}



	});


	var c=0;
	me._getActionCounter=function(){
		return c++;
	};


	me._height=1.74;
	me._eyes=1.64;
	me._span_r=0.3; //radius of width and depth of player


}
Movement.prototype.__proto__ = events.EventEmitter.prototype;


/**
 * move to absolute position, and look (yaw) in direction of movement
 */
Movement.prototype.moveTo=function(position, callback){
	var me=this;

	var to={ 
			x:(position.x===undefined?me.position.x:position.x),
			y:(position.y===undefined?me.position.y:position.y),
			z:(position.z===undefined?me.position.z:position.z),
			onGround:me.position.onGround
	};

	var yaw=me.calculateYaw(position.x-me.position.x, position.z-me.position.z);
	//console.log('walk abs '+JSON.stringify(to)+" from "+JSON.stringify(me.position));

	

	//me.client.write('position', to);
	//me.client.write('look',{yaw:yaw, pitch:me.position.pitch, onGround:me.position.onGround});	

	me.position.x=to.x;
	me.position.y=to.y;
	me.position.z=to.z;
	me.position.yaw=yaw;

	if(callback){
		setTimeout(callback, 0);
	}
	
	me.emit('move', me.position);
	
	return me;
};

/**
 * 
 */
Movement.prototype.moveToRelative=function(position, callback){
	var me=this;

	var to={ 
			x:me.position.x+(position.x===undefined?0:position.x),
			y:me.position.y+(position.y===undefined?0:position.y),
			z:me.position.z+(position.z===undefined?0:position.z),
			onGround:me.position.onGround
	};
	
	return me.moveTo(to, callback);

};


/* 
 * caculate yaw given relative move x,z. uses algorithm at
 * http://wiki.vg/Protocol#Player_Look
 */
Movement.prototype.calculateYaw=function(x, z){

	var c = Math.sqrt( x*x + z*z );
	var alpha1 = -Math.asin(x/c)/Math.PI*180;
	var alpha2 =  Math.acos(z/c)/Math.PI*180;
	if(alpha2 > 90){
		return 180 - alpha1;
	}else{
		return alpha1;
	}
};


Movement.prototype.look=function(look, callback){
	var me=this;

	var to={ 
			yaw:(look.yaw===undefined?me.position.yaw:look.yaw),
			pitch:(look.pitch===undefined?me.position.pitch:look.pitch),
			onGround:me.position.onGround
	};

	//me.client.write('look', to);

	me.position.yaw=to.yaw;
	me.position.pitch=to.pitch;

	
	if(callback){
		setTimeout(callback, 0);
	}
	
	return me;

};


Movement.prototype.lookAtPoint=function(position, callback){
	var me=this;
	
	var x=(position.x===undefined?0:position.x-me.position.x);
	var z=(position.z===undefined?0:position.z-me.position.z);
	var y=position.y===undefined?0:position.y-me.position.y;
 	var yaw=me.calculateYaw(x,z);
	
 	var d=Math.sqrt(x*x+z*z);
 	
	var pitch=y===0?0:-(Math.atan(y/d))*180/Math.PI;
	
	var to={ 
		yaw:yaw,
		pitch:pitch,
		onGround:me.position.onGround
	};

	//me.client.write('look', to);

	//console.log(JSON.stringify(to)+" "+JSON.stringify({x:x,y:y,z:z}));
	
	me.position.yaw=to.yaw;
	me.position.pitch=to.pitch;

	
	if(callback){
		setTimeout(callback, 0);
	}
	
	return me;

};
Movement.prototype.isCrouching=function(){
	var me=this;
	return me._crouching;
};
Movement.prototype.crouch=function(callback){
	var me=this;
	
	if(!me.isCrouching()){
		me.client.write('entity_action', {entityId:me.client.entityId, actionId:0, jumpBoost:0});
		me._crouching=true;
		me.emit('crouch');
		
		if(callback){
			setTimeout(callback, 0);
		}
	}else{
		if(callback){
			setTimeout(callback, 0);
		}
	}
	
	
	return me;
};

Movement.prototype.stand=function(callback){
	var me=this;
	if(me.isCrouching()){
		me.client.write('entity_action', {entityId:me.client.entityId, actionId:1, jumpBoost:0});
		me._crouching=false;
		me.emit('stand');
		
		if(callback){
			setTimeout(callback, 0);
		}
	}else{
		if(callback){
			setTimeout(0);
		}
	}
	
	return me;
};

//returns an array of blocks positions that the client is standing on at most 4 blocks
Movement.prototype.currentFloorPositions=function(){
	var me=this;
	return me.scog.floorListColumnSliceAt(me.position, me._span_r);
};

//jump and fall are the same. one has initial velocity
Movement.prototype.fall=function(to, callback){
	var me=this;
	if(me._falling||me._jumping)return;
	me._falling=true;
	
	
	var vi=0;
	var d0=me.position.y; // initial y (distance)
	me.emit('fall', d0, to);

	var df=to; // end position abs is updated to check floor on each loop. < 1 milli sec
	
	var d=d0;  // current y
	
	var a=-20;
	
	
	var f=null;
	inAir=function(){
		if(!(f&&me.scog.isEqualTo(me.position, f, true))){
			f=me.scog.findFloor(me.position);
			console.log('calc fall bottom at '+f.y);
		}
		df=(f.y+1);
		return me.position.y>df;
	};
	
	var ti=0; //time i
	var td=0.02; //delta

	next=function(){
		if(inAir()){
			me.position.onGround=true;
			ti+=td; //increment first.
			//calc distance
			d=d0+vi*ti+(a*ti*ti)/2.0;
			me.position.y=d;
			me.emit('move', me.position);
			setTimeout(next, td*1000);
			

		}else{
			me.position.onGround=true;
			me.position.y=df;
			me._falling=false;
			me.emit('fell', d0, df);
			if(callback){
				setTimeout(callback, 0);
			}
			
		}
		
	};
	
	setTimeout(next, td*1000);

	return me;
	
	
	
};




Movement.prototype.jump=function(callback){
	var me=this;
	if(me._falling||me._jumping)return;
	me._jumping=true;
	me.emit('jump');
	
	var vi=Movement.JumpV0; //initial velocity
	var vx=vi; //current velocity
	var d0=me.position.y; // initial y (distance)

	var df=d0; // end position abs is updated to check floor on each loop. < 1 milli sec
	var d=d0;  // current y
	
	var a=Movement.Gravity;
	inAir=function(){
		if(vx>0)return true;
		me.position.onGround=true; //switch
		df=(me.scog.findFloor(me.position).y+1);
		return me.position.y>df;
	};
	var ti=0; //time i
	var td=0.02; //delta

	
	var tn=-vi/a; //calculate top of jump. for event jump.top
	
	
	next=function(){
		
		if(inAir()){
			me.position.onGround=false;
			ti+=td; //increment first.
			//calc distance
			d=d0+vi*ti+(a*ti*ti)/2.0;
			vx=vi+(a*ti);

			me.position.y=d;
			me.emit('move', me.position);
			setTimeout(next, td*1000);
			

		}else{
			
			me.position.onGround=true;
			me.position.y=df;
			me._jumping=false;
			me.emit('jumped');
			if(callback){
				setTimeout(callback, 0);
			}
			
		}
		
	};
	
	setTimeout(next, td*1000);
	setTimeout(function(){
		me.emit('jump.top');
	},tn*1000);

	return me;
};


Movement.prototype.walkToward=function(point, pathfinder, time, callback){
	var me=this;
	var vel=Movement.WalkSpeed;
	if(me.isCrouching()){
		vel=Movement.SneekSpeed;
	}
	return me.moveToward(point, pathfinder, time, vel, callback);

};

Movement.prototype.runToward=function(point, pathfinder, time, callback){
	var me=this;
	var vel=Movement.RunSpeed;
	if(me.isCrouching()){
		vel=Movement.SneekSpeed;
	}
	return me.moveToward(point, pathfinder, time, vel, callback);

};

Movement.prototype.canMoveTo=function(p){
	var me=this;
	var s={x:me.position.x, y:me.position.y-1, z:me.position.z};
	var e={x:p.x, y:p.y-1, z:p.z};
	var f0=me.scog.findFloor(s);
	var f1=me.scog.findFloor(p);
	
	

	var maxFall=4;
	var maxJump=1;
	
	
	
	if(me.scog.isEqualTo(f0, f1)){
		//console.log('already there');
		//
		return true;
	}
	

	var coords=me.scog.floorPositionsAlongWidePath(me._span_r, s, e);
	
	//me.scog.printFloorplan(me.scog.coordsToFloorplan(coords));
	/*me.scog.printFloorplan(me.scog.coordsToFloorplan(coords),function(b,x,z){
		if(b===null){
			return '[   ]';
		}
		return '['+x+','+z+']';
	});
	*/
	
	
	//console.log('coords calc floor'+JSON.stringify(coords));
	for(var i=1; i<coords.length;i++){
		var y0=coords[i-1].y;
		var y1=coords[i].y;
		if(y1-y0>maxJump){
			console.log('too high');
			
//			console.log('floor path: '+JSON.stringify([s, e]));
//			
//			me.scog.printFloorplan(me.scog.coordsToFloorplan(coords));
//			me.scog.printFloorplan(me.scog.coordsToFloorplan(coords),function(b,x,z){
//				if(b===null){
//					return '[   ]';
//				}
//				return '['+x+','+b.y+','+z+']';
//			});
			
			
			return false;
		}
		if(y0-y1>maxFall){
			console.log('error too low');
			return false;
		}
	}
	
	if(coords.length==0){
		console.log('error: no route');
		return false;
	}
	
	return true;
};
//calculates jump position as distances along path, with horizontal velocity
Movement.prototype.calcJumpsTo=function(p, v){
	var me=this;
	var s={x:me.position.x, y:me.position.y-1, z:me.position.z};
	var f0=me.scog.findFloor(s);
	var f1=me.scog.findFloor(p);
	
	var maxJump=1;
	
	var jumpPoints=[]; //an array with distances. distance along path from me to p, where player should jump.
	

	if(me.scog.isEqualTo(f0, f1)){
		return [];
	}

	var coords=me.scog.floorPositionsAlongWidePath(me._span_r, s, p);
	
	var ttop=-v/Movement.Gravity; //time to top of jump. 
	var dist=v*ttop; //distance (before) away from target to jump at. (positive distance)
		
	//console.log('coords calc jumps'+JSON.stringify(coords)+'  '+JSON.stringify(f0));
	for(var i=1; i<coords.length;i++){
		var y0=coords[i-1].y;
		var bi=coords[i];
		var y1=bi.y;
		if(y1-y0==maxJump){
			
			var p0=spatial.path2DEntersBlockAt(bi, s, p);
			//var p1=me.scog.math.path2DEntersBlockAt(coords[i], me.position, p);
			
			var d0=spatial.path2DDistanceAtPoint(p0, me.position, p);
			var j=d0-Math.max(dist, me._span_r);
			
			//console.log('jump to '+JSON.stringify(p0)+' '+d0+' '+j+' from '+JSON.stringify(spatial.path2DPointAtDistance(j, s, p)));
			//console.log('jump: '+JSON.stringify(p0)+' - '+d);
			
			//{distance of jump start, position of jump at top}
			jumpPoints.push({j:j, d:d0, p:p0});
		}
	}
	
	if(coords.length==0){
		console.log('no route');
		return [];
	}
	
	if(jumpPoints.length){
		
//		me.scog.printFloorplan(me.scog.coordsToFloorplan(coords));
//		me.scog.printFloorplan(me.scog.coordsToFloorplan(coords),function(b,x,z){
//			if(b===null){
//				return '[   ]';
//			}
//			return '['+b.x+','+b.y+','+b.z+']';
//		});
		
		
		
		//process.exit(0);
	}
	
	return jumpPoints;
};


Movement.prototype.moveToward=function(point, pathfinder, time, velocity, callback){
	var me=this;
	
	if(me._moving===true){
		//console.log((new Error('already moving to point')));	
		return me;
	}
	me._moving=true;
	
	//var action=me._getActionCounter();
	
	var start={x:me.position.x, y:me.position.y, z:me.position.z};
	
	if(!me.canMoveTo(point)){
		if(pathfinder){
			//pathfinder should be a simple object
			//takes over, and fires the callback 
			pathfinder.route(start, point, time, callback);
			return me;
		}
		
		if(callback){
			callback(new Error('unreachable destination: no pathfinder'));
		}
		me._moving=false;
		return me;
		
	}
	
	
	var jumps=me.calcJumpsTo(point, velocity);
	//console.log('jumps: '+JSON.stringify(jumps));
	
	
	var td=0.02;
	var vi=velocity;
	var di=td*vi; //distance unit.
	
	//console.log('moveToward '+JSON.stringify({x:point.x, z:point.z, d:spatial.path2DDistance(start, point)}));
	
	//var maxdist=vi*(time/1000.0); //max distance that could be walked within time
	
	var timeout=null;
	
	var finished=false;
	var finish=function(){
		if(finished){
			//console.log("#"+action+"  should have already finished");
			return;
		}
		//console.log("#"+action+"  finish");
		clearInterval(timeout);
		finished=true;
		
		
		//could move a little bit by calculating the time between last move operation and now
		me._moving=false;
		if(callback){
			callback();
		}
	};
	
	
	//ignores y
	var calcPosN=function(d){
		return spatial.path2DPointAtDistance(d, start, point);
	};


	
	var pos=calcPosN(0);	//location in td (time from now) if v is constant.
	var d=0;
	var move=function(){
		
		if(jumps.length&&jumps[0].j<d){
			(function(jump){
				
				//console.log("#"+action+' run run jump...');
				
				me.jump(function(){
					d=jump.d;  //land distance
					pos=jump.p; //land position
				});	
				
				me.once('jump.top', function(){
					me.position.x=jump.p.x;
					me.position.z=jump.p.z;
				});
				
			})(jumps.shift());
			
			return;
		}
		
		if(me._isFalling||me._isJumping)return;
		
		me.position.x=pos.x;
		me.position.z=pos.z;
		
		d=spatial.path2DDistanceAtPoint(me.position, start, point);
		var f=spatial.path2DFractionAtDistance(d, start, point);
		//console.log("#"+action+"  d:"+d+" f:"+f);
		
		pos=calcPosN(d+di); //for next loop;
		
		if((!me.canMoveTo(pos))||f>=1){
			finish();
		}
	};


	
	
		
	if(jumps.length&&jumps[0].j<di){
		//console.log("#"+action+' jumping first...');
		
		
		me.jump(function(){
			d=jumps[0].d;  //land distance
			pos=jumps[0].p; //land position
			
			jumps.shift();
			
			
			if(finished) return;
			
			move();
			//console.log("#"+action+"  start after jump");
			timeout=setInterval(move, (td)*1000);
		});	
		
		
	
		me.once('jump.top', function(){
			me.position.x=jumps[0].p.x;
			me.position.z=jumps[0].p.z;
		});
		
		
		setTimeout(function(){ 
			//console.log("#"+action+' finished while jumping '+time )
			finish(); 
		}, time);
		
		
	}else{
		//console.log("#"+action+"  start");
		move();
		timeout=setInterval(move, td*1000);
		
		
		setTimeout(function(){ 
			//console.log("#"+action+' finished on timeout '+time )
			finish(); 
		}, time);
	}
	
	
	
	return me;
};

//2d measurement
Movement.prototype.measureTo=function(p){
	var me=this;
	return Math.sqrt(Math.pow(p.x-me.position.x, 2)+Math.pow(p.z-me.position.z, 2));
	
};

Movement.prototype.measure3dTo=function(p){
	var me=this;
	return Math.sqrt(Math.pow(p.x-me.position.x, 2)+Math.pow(p.z-me.position.z, 2)+Math.pow(p.y-me.position.y, 2));
	
};


Movement.SneekSpeed=2;
Movement.WalkSpeed=3.5;
Movement.RunSpeed=5;

Movement.Gravity=-20;
Movement.JumpV0=6.5;
