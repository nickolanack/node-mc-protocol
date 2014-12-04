var assert=require('assert');

var spatial=require('../mc-spatial.js');

console.log('Tests path2DExitsBlockAt path2DEntersBlockAt');

//this should tests points that make strait lines ie: x or z is constant while the other changes
//should text both x, and z straight lines

//lines that go in x=0 out x=1, in z=0 z=1

//lines that go in x=0 z=1
//lines that go in z=0 x=1


assert.deepEqual(
		{x:1,y:0,z:0.5},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:0,y:0,z:0.5},{x:1,y:0,z:0.5})
		);

assert.deepEqual(
		{x:0,y:0,z:0.5},
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:0,y:0,z:0.5},{x:1,y:0,z:0.5})
		);


assert.deepEqual(
		{x:0,y:0,z:0.5},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:1,y:0,z:0.5},{x:0,y:0,z:0.5})
		);


assert.deepEqual(
		{x:0.5,y:0,z:1},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:0.5,y:0,z:0},{x:0.5,y:0,z:1})
		);

assert.deepEqual(
		{x:0.5,y:0,z:0},
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:0.5,y:0,z:0},{x:0.5,y:0,z:1})
		);

assert.deepEqual(
		{x:1,y:0,z:0.2}, 
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:0,y:0,z:0},{x:0.5,y:0,z:0.1})
		);


assert.deepEqual(
		{x:0.5,y:0,z:0},
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:0.5,y:0,z:0},{x:0.5,y:0,z:1})
		);

//positive into x=0 out x=1

assert.deepEqual(
		{x:0,y:0,z:0.25}, //0.25
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:-0.5,y:0,z:0},{x:1.5,y:0,z:1})
		);


assert.deepEqual(
		{x:1,y:0,z:0.75},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:-0.5,y:0,z:0},{x:1.5,y:0,z:1})
		);


//negative slope 
assert.deepEqual(
		{x:0,y:0,z:0.75}, //0.25
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:-0.5,y:0,z:1},{x:1.5,y:0,z:0})
		);


assert.deepEqual(
		{x:1,y:0,z:0.25},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:-0.5,y:0,z:1},{x:1.5,y:0,z:0})
		);



//positive slope in z=0. 
assert.deepEqual(
		{x:0.25,y:0,z:0}, //0.25
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:0,y:0,z:-0.5},{x:1,y:0,z:1.5})
		);


assert.deepEqual(
		{x:0.75,y:0,z:1},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:0,y:0,z:-0.5},{x:1,y:0,z:1.5})
		);


//positive slope in z=1. 
assert.deepEqual(
		{x:0.25,y:0,z:1}, //0.25
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:0,y:0,z:1.5},{x:1,y:0,z:-0.5})
		);


assert.deepEqual(
		{x:0.75,y:0,z:0},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:0,y:0,z:1.5},{x:1,y:0,z:-0.5})
		);


assert.deepEqual(
		{x:2/3,y:0,z:0},
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:0,y:0,z:2},{x:1,y:0,z:-1})
		);

//in x=0 out z=1

assert.deepEqual(
		{x:0,y:0,z:0.5}, 
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:-0.5,y:0,z:0},{x:1,y:0,z:1.5})
		);

assert.deepEqual(
		{x:0.5,y:0,z:1}, 
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:-0.5,y:0,z:0},{x:1,y:0,z:1.5})
		);

//in z=0 out x=1
assert.deepEqual(
		{x:0.5,y:0,z:0}, 
		spatial.math.path2DEntersBlockAt({x:0,y:0,z:0},{x:0,y:0,z:-0.5},{x:1,y:0,z:0.5})
		);

assert.deepEqual(
		{x:1,y:0,z:0.5}, 
		spatial.math.path2DExitsBlockAt({x:0,y:0,z:0},{x:0,y:0,z:-0.5},{x:1,y:0,z:0.5})
		);

var fn=spatial.math.path2DFunctions({x:0,y:0,z:0},{x:5,y:0,z:5});
var tangents=spatial.math.path2DContraintPaths(0.3, {x:0,y:0,z:0},{x:5,y:0,z:5});
var fn0=spatial.math.path2DFunctions(tangents[0][0], tangents[0][1]);
var fn1=spatial.math.path2DFunctions(tangents[1][0], tangents[1][1]);

console.log(JSON.stringify([fn, fn0, fn1]));



assert.equal(fn0.offset,-0.3/Math.cos(Math.PI/4))
assert.equal(fn1.offset,+0.3/Math.cos(Math.PI/4))


assert(spatial.math.path2DPathsAreParallel(tangents[0],[{x:0,y:0,z:0},{x:5,y:0,z:5}]));
assert(spatial.math.path2DPathsAreParallel(tangents[1],[{x:0,y:0,z:0},{x:5,y:0,z:5}]));




console.log('Complete');
