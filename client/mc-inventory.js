
module.exports = {
		createInventory: createInventory
}


function createInventory(client, itemMap){
	

	var inventory=new Inventory(client);	
	inventory.setInventoryMap(itemMap);
	
	
	client.on('entity_equipment',function(data){
		if(data.entityId==client.entityId){
			console.log('entity_equipment: '+JSON.stringify(data));
		}
	});
	
	
	client.on('held_item_slot',function(data){
		console.log('held_item_slot: '+JSON.stringify(data));
		inventory._held=data.slot;
	});
	
	client.on('collect',function(data){
		if(data.collectorEntityId==client.entityId){
			console.log('collected: '+JSON.stringify(data));
			inventory.emit('collected');
		}
	});
	
	client.on('update_attributes',function(data){
		if(data.entityId==client.entityId){
			console.log('update_attributes: '+JSON.stringify(data));
		}
	});
	
	
	client.on('window_items',function(data){
		if(data.windowId==0){
			//console.log('window_items: '+JSON.stringify(data));
			
			data.items.forEach(function(item,i){
				
				if(item.id>0){		
					inventory.set(i, item); //store object representation of slot
				}
			});
		}
	});
	

	client.on('open_window',function(data){
		if(data.windowId==0){
			console.log('open_window: '+JSON.stringify(data));
		}
	});
	
	client.on('set_slot',function(data){
		if(data.windowId==0){
			inventory.set(data.slot, data.item);
		}
	});
	
	client.on('transaction',function(data){
		if(data.windowId==0){
			console.log('transaction: '+JSON.stringify(data));
		}
	});
	
	client.on('craft_progress_bar',function(data){
		if(data.windowId==0){
			console.log('craft_progress_bar: '+JSON.stringify(data));
		}
	});
	
	
	
	return inventory;
	
}

var events=require('events');
function Inventory(client){
	var me=this;
	me.client=client;
	events.EventEmitter.call(this);
	
	me._held=0;
	
	me._inventory=[
	               
	               null, null, null, null, null,
	               null, null, null, null, null,
	               null, null, null, null, null,
	               
	               null, null, null, null, null,
	               null, null, null, null, null,
	               null, null, null, null, null,
	               
	               null, null, null, null, null,
	               null, null, null, null, null,
	               null, null, null, null, null
	               
	               ];
	
	
	var trns=1;
	me._getTransaction=function(){
		var num=trns;
		trns++;
		return num;
	};
	
}
Inventory.prototype.__proto__ = events.EventEmitter.prototype;

Inventory.prototype.get=function(i){
	return this._inventory[i];
};



Inventory.prototype.set=function(i, item){
	var me=this;
	me._inventory[i]=item;
};

Inventory.prototype.count=function(itemid){
	
	var me=this;
	var count=0;
	me._inventory.forEach(function(item){
		if(item&&item.id==itemid)count+=item.itemCount;
	});
	return count;
};

Inventory.prototype.itemAt=function(slot){
	
	var me=this;
	return me._inventory[slot];
	
};

Inventory.prototype.listItems=function(format){
	
	var me=this;
	var list=[];
	
	var fmttr=format?format:function(v, k){
		return v;
	};
	
	me._inventory.forEach(function(item, loc){
		if(item&&list.indexOf(item.id)==-1){
			var v=fmttr(item, loc);
			if(v)list.push(v);
		}
	});
	return list;
};

Inventory.prototype.slotsWithItem=function(itemid){
	
	var me=this;
	var slots=[];
	me._inventory.forEach(function(item, i){
		if(item&&item.id==itemid){
			slots.push(i);
		}
	});
	return slots;

};

Inventory.prototype.heldSlot=function(itemid){
	
	var me=this;
	return me._held+36;
};

Inventory.prototype.listActions=function(itemid){

	var me=this;
	me.idToString(itemid);
	
};



Inventory.prototype.discard=function(itemid, number, transaction, callback){
	
	var me=this;
	var slots=me.slotsWithItem(itemid);

	console.log(JSON.stringify(['entity_action',{entityId:me.client.entityId, actionId:6, jumpBoost:0}]));
	me.client.write('entity_action',{entityId:me.client.entityId, actionId:6, jumpBoost:0});


	console.log('discarding items at: '+JSON.stringify(slots));

	var i=0;
	var slotNumber=slots[i];
	var slotData=me._inventory[slotNumber];

	var trans_discard=me._getTransaction();

	me.client.once('transaction',function(data){

		if(data.windowId==0&&data.action==trans_discard&&data.accepted){

			me.client.once('transaction',function(data){

				if(data.windowId==0&&data.action==trans_discard){
					me.client.write('transaction', data);
				}

				me.client.write('close_window', {windowId:0});
			});

			me.client.write('window_click',{

				windowId:0,
				slot:-999,			
				action:trans_discard,
				item:null,
				mode:0,
				mouseButton:0  

			});

		}else{
			me.client.write('transaction', data);
		}


	});

	me.client.once('set_slot',function(data){
		if(data.windowId==0){
			console.log('set_slot: '+JSON.stringify(data));
		}
	});

	me.client.write('window_click',{

		windowId:0,
		slot:slotNumber,			
		action:trans_discard,
		item:slotData,
		mode:0,
		mouseButton:0  

	});
	//}

                            
	
};

//returns an empty slot id
Inventory.prototype.emptySlot=function(){
	
	var me=this;
	for(var i=0;i<me._inventory.length;i++){
		if(me._inventory[i]===null)return i;
	}
	return false;
};

Inventory.prototype.swap=function(slota, slotb, transaction, callback){
	
	
	var me=this;
	var a=me.itemAt(slota);
	var b=me.itemAt(slotb);
	
	if(transaction<1){
		transaction=me._getTransaction();
	}
	
	if(a===null&&b===null){
		if(callback)callback(null);
		return me;
	}
	if(a===null){
		return me.swap(slotb, slota, transaction, callback);
	}
	
	me.client.once('transaction',function(data){
		
		if(data.windowId==0&&data.action==transaction&&data.accepted){
			
			
			me.client.once('transaction',function(data){
				
				if(data.windowId==0&&data.action==transaction&&data.accepted){
					
					if(b!==null){
					
					me.client.write('window_click',{
						
						windowId:0,
						slot:bestHelmet[0],			
						action:transaction,
						item:null,
						mode:0,
						mouseButton:0  
						
					});
					
					}	
					
					if(callback)callback(null);
					
					
				}else{
					if(callback)callback(true);
				}
			});
			
			
			
			me.client.write('window_click',{
				
				windowId:0,
				slot:slotb,			
				action:transaction,
				item:b,
				mode:0,
				mouseButton:0  
				
			});
			
		}else{
			if(callback)callback(true);
		}
	});
	
	me.client.write('window_click',{
		
		windowId:0,
		slot:slota,			
		action:transaction,
		item:a,
		mode:0,
		mouseButton:0  
		
	});
	
	return me;
	
};


Inventory.prototype.autoequip=function(callback){
	
	var me=this;
	var trans_equip=me._getTransaction();
	
	

	var equip=function(slot, name, then){
		
		var best=null;
		if(me.itemAt(slot)===null){
			
			me.listItems(function(v, k){
				if(k==slot)return;
				if(me.idToString(v.id).indexOf(name)==-1)return;
				if(best!==null){
					//compare
				}else{
					best=[k,v];
				}
			});
			
			if(best!==null){
				console.log(name+' Swap: '+slot+' '+best[0]);
				me.swap(slot, best[0], trans_equip, function(error){
					then();
				}, trans_equip);
				
			}else{
				console.log('Skip '+name+' Swap');
				then();
			}

		}else{
			then();
			console.log('Skip '+name+' Swap');
		}
		
		
	};
	
	var unequip=function(slot, callback){   	// called like (fn(processNextQueueItem))
  	  me.swap(slot, me.emptySlot(), trans_equip, callback);
    };
	
	
	// array of arguments, the first being the a function that accepts a callback as last arg
	// the rest of the arguments are arguments to the function excluding the callback
	
	var queue=[
	      
	      [equip, 5, 'Helmet'], 	// called like equip(5, 'Helmet', processNextQueueItem);
	      [equip, 6, 'Chestplate'],	  
	      [equip, 7, 'Leggings'],
	      [equip, 8, 'Boots'],
	      
	      [unequip, 36],
	      [equip, 36, 'Sword'],
	      
	      [unequip, 37],
	      [equip, 37, 'Pickaxe'],
	      
	      [unequip, 38],
	      [equip, 38, 'Shovel'],
	      
	];
	
	var execute=function(queue){
		
		if(queue.length>0){
			var first=queue.shift();
			first[0].apply(first[0], first.slice(1).concat([function(){
				execute(queue);
			}]));
		}else{
			if(callback)callback();
		}
		
	};
	execute(queue);
	
	
	
	
	

	
	
};


Inventory.prototype.useSlot=function(slot){
	
	if(slot>=36&&slot<45){
		slot-=36;
	}
	
	if(slot<0||slot>8){
		console.log('invalid slot: '+slot);
		return;
	}
	
	var me=this;
	me.client.write('held_item_slot',{
		slot:slot
	});
	me._held=slot;
	
};




Inventory.prototype.drop=function(){
	
	var me=this;
	me.client.write('block_dig',{
		status:4,
		position:{x:0,y:0,z:0},
		face:0
	});
};

Inventory.prototype.dropStack=function(){
	
	var me=this;
	me.client.write('block_dig',{
		status:3,
		position:{x:0,y:0,z:0},
		face:0
	});
};







Inventory.prototype.idToString=function(itemid, data){
	var me=this;
	
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
	return 'unknown';
};


Inventory.prototype.stringToId=function(name){
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
Inventory.prototype.setInventoryMap=function(data){
	var me=this;
	me._itemMap=data;
};





