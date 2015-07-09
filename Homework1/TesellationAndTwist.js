"use strict";

var canvas;
var gl;

var points = [];

var numTimesToSubdivide = 0;

var bufferId;

var scale=1;
var angle=0;

var anglePosition;
var scalePosition;


function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }


    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, Math.pow(4, 5)*8*3, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	anglePosition = gl.getUniformLocation( program, "angle" );
	scalePosition = gl.getUniformLocation( program, "scale" );
	
    document.getElementById("tesellationSlider").onchange = function() {
        numTimesToSubdivide = event.srcElement.value;
        render();
    };
	
	document.getElementById("angleSlider").onchange = function() {
        angle = event.srcElement.value;
        render();
    };
	
	document.getElementById("scaleSlider").onchange = function() {
        scale = 1/event.srcElement.value;
        render();
    };


    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function divideTriangle( a, b, c, count )
{
    // check for end of recursion

    if ( count == 0 ) {
        triangle( a, b, c );
    }
    else {
       //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
		divideTriangle( ab, bc, ac, count );
    }
}

window.onload = init;

function render()
{
	var theta=Math.PI*2/3;
	var shift=-theta/4;
    var vertices = [
        vec2( Math.cos(theta+shift), Math.sin(theta+shift) ),
        vec2(  Math.cos(2*theta+shift), Math.sin(2*theta+shift) ),
        vec2(  Math.cos(3*theta+shift), Math.sin(3*theta+shift) )
    ];
    points = [];
    divideTriangle( vertices[0], vertices[1], vertices[2],
                    numTimesToSubdivide);
				
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    gl.clear( gl.COLOR_BUFFER_BIT );
	
	gl.uniform1f(anglePosition, angle);
	gl.uniform1f(scalePosition, scale);
	
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    points = [];
    //requestAnimFrame(render);
}
