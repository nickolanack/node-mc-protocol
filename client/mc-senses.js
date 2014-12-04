
var events =


module.exports = {
		createSenses: createSenses
}


function createSenses(client, mc){
	
	
	var states=mc.protocol.states;
	var senses=new Senses();	
	
	//http://wiki.vg/Protocol#Update_Health
	client.on('update_health',function(data){
		console.log(JSON.stringify(data));
		//should update health, 
		//should update hunger,
		//do i care about food saturation...
		
		
		//senses.set('health', data)
		senses.initset('health', data.health);
		senses.initset('food', data.food);
		
		if(data.health===0)senses.emit('death');
		
	});
	

	var daytime=0;
	

	
	//http://wiki.vg/Protocol#Time_Update
	client.on('update_time',function(data){
		//example data {"id":3,"age":7996260,"time":8532299}
		
		//0 sunrise, 6000 noon, 12000 sunset, 18000 midnight, 24000 sunrise
		daytime=data.time%24000

		if(daytime>13000){
			senses.initset('time', 'night');
		}else if(daytime>12000){
			senses.initset('time', 'dusk');
		}else if(daytime>0){
			senses.initset('time', 'day');
		}else{
			senses.initset('time', 'night');
		}

		
		
	});
	
	
	
	
	//client.on('entity_equipment',function(data){
		//if(entities.indexOf(data.entityId)===-1){
		//	entities.push(data.entityId);
		//}
	//});	
	
	//http://wiki.vg/Protocol#Animation
	client.on('animation',function(data){
		console.log(JSON.stringify(data));
	});
	
	client.on('respawn',function(data){
		console.log(JSON.stringify(data));
	});
	
	client.on('bed',function(data){
		console.log(JSON.stringify(data));
	});
	
	var ignoreRainFor=5; //seconds
	
	var initRain=function(data){
		if(data.reason==1){
			senses.init('rain', true);
		}
	};
	
	//should catch raining at the start of the game.
	client.on('game_state_change',initRain);
	
	setTimeout(function(){
		client.removeListener('game_state_change',initRain);
		client.on('game_state_change',function(data){
			
		
			if(data.reason==1){
				senses.set('rain', true);
			}
			if(data.reason==2){
				senses.set('rain', false);
			}
			
		});
	},ignoreRainFor*1000);
	
	
	return senses;
	
}

var events=require('events');
function Senses(){
	events.EventEmitter.call(this);
	this._senseState={
	};
}
Senses.prototype.__proto__ = events.EventEmitter.prototype;

/**
 * allows a controller or planner to anticipate some sense
 * and lessen the shock of an unexpected sense like pain (if the planner decides to attack)
 */
Senses.prototype.expect=function(sense, ticks){
	
}


Senses.prototype.get=function(name){
	return this._senseState[name];
}

Senses.prototype.has=function(name){
	return this._senseState[name]!==undefined;
}
Senses.prototype.initset=function(name, value){
	if(this.has(name)){
		this.init(name, value);
	}else{
		this.init(name, value);
	}
	return this._senseState[name];
}
Senses.prototype.init=function(name, value){
		this._senseState[name]=value;
}

Senses.prototype.set=function(name, value){
	
	if(this._senseState[name]!=value){
		var last=this._senseState[name];
		this._senseState[name]=value;
		
		this.emit('sense', name, value, last);
		this.emit(name, value, last);
		this.emit(name+'.'+value);
		
	}
}


