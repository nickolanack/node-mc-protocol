module.exports = {
		createPathfinder: createPathfinder
}

var spatial=require('./mc-spatial.js').math;

function createPathfinder(scog){
	
	return new Pathfinder(scog);
	
}

var events=require('events');
function Pathfinder(scog){
	
	var me=this;
	events.EventEmitter.call(me);
	me.scog=scog;
	
	
}

Pathfinder.prototype.__proto__ = events.EventEmitter.prototype;


/**
 * create a route from point to dest. 
 */
Pathfinder.prototype.route=function(from, to, time, callback){
	
	
	//This is just an A* implementation...
	
	var me=this;
	
	
	var goal=me.scog.findFloor(to);
	
	var start=me.scog.findFloor(from);
	
	
	
	console.log('Path Finder: '+JSON.stringify({from:from, to:to}));
	
	
	var open=[];
	var closed=[];
	
	
	start.g=0;
	start.h=spatial.path2DDistance(start, goal);
	
	open.push(start);
	var max=500;
	var i=0;
	while(open.length){
		if(max--<=0){
			console.log('took too long');
			return false;
		}
		console.log(i);
		
		var c=open.shift();
		if(me.scog.isEqualTo(c, goal)){
			console.log('done reconstruct');
			
			
			var path=[goal];
			var tmp;
			while(c.parent){
				path.push({x:c.x, y:c.y, z:c.z});
				c=c.parent;
			}
			
			me.scog.printFloorplan(me.scog.coordsToFloorplan(path));
			
			return;
		}
		closed.push(c);
		
		
		
		me.scog.floorNeighbours(c).forEach(function(n){
			if(me.scog.positionListContains(closed, n)||(c.y-n.y)!=0){
				//console.log('skip '+JSON.stringify(n));
				
				return;
			}
			
			var dx=c.x-n.x;
			var dz=c.z-n.z;
			
			if(dx!=0&&dz!=0){
				//no angles...
				return;
			}
			
			n.parent=c;
			n.g=c.g+spatial.path2DDistance(c, n);
			n.h=spatial.path2DDistance({x:n.x+0.5, y:n.y, z:n.z+0.5}, to);
			n.f=n.g+n.h;
			if(!me.scog.positionListContains(open, n)){
				open.push(n);
			}else{
				//check item in open list and compare 'g' if
				//this g is less then replace.
			}
			
		});
		
		open.sort(function(a, b){
			return a.f-b.f;
		});
		
//		console.log('open length: '+open.length);
//		console.log('closed length: '+closed.length);
//		open.forEach(function(o){
//			console.log(o.f);
//		});
		
	}
	console.log('no path');
	
};