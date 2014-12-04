/*
 * items.txt looks like
 * 
		0	
    	Air
    	(minecraft:air)
    	1	
    	Stone
    	(minecraft:stone)
    	1:1	
    	Granite
    	(minecraft:stone)
    	
    	...
    	...
 */

require('fs').readFile('./items.txt', function (err, data) {

	var map=[[],[],[]];

	if(data instanceof Buffer){
		data=data.toString();
	}
	var cur_a=0;
	data.split("\n").forEach(function(line){

		var l=line.replace(/^\s+|\s+$/g,'');
		if(l==="")return;

		if(cur_a==0){
			var p=l.split(':');
			map[cur_a].push(p.length==1?p+':0':l);
		}

		if(cur_a==1){
			map[cur_a].push(l);
		}

		if(cur_a==2){
			map[cur_a].push(l.substring(1,l.length-1));
		}

		cur_a=(cur_a+1)%3;
	});
	require('fs').writeFile('./mc-items.json',JSON.stringify(map));
});