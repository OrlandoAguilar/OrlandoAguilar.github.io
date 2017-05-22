"use strict";

var canvas;
var gl;


var maxNumVertices = 10240;
var index = 0;
var auxiliarBuffer_Id = 0;
var thickness = 10;


var vPos=null;
var vNormals = null;
var modelViewMatrixLoc = null;
var projectionMatrixLoc = null;
var normalMatrixLoc = null;

var LightPosLoc= [];
var diffuseLightLoc = [];
var specularLightLoc = [];

var activeLight = [true,true,true];
var activeLightLoc = [];

var SHLoc = null;

var timeLoc = null;

var wireframeLoc = null;

var modelViewMatrix;
var projectionMatrix;


var near = 0.3;
var far = 1000.0;
var radius = 8.0;
var theta = 0.0;
var phi = 0.0;


const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var objectTypeToCreate=SPHERE;

var coefficients = [
2.586759806, -0.4314934313, -0.3538860381, -0.6042693257, 0.3201206326, -0.1374350786, -0.05210084468, -0.1173124164, -0.09002771974,
2.730807781, -0.6651284695, 0.04834771156, -0.8862298131, 0.4229421318, -0.1686660349, -0.1499986351, -0.167150721, -0.02107107267,
3.152812243, -0.9691237807, 0.6727546453, -1.298684001, 0.5417827368, -0.229636699, -0.2321268767, -0.2650154829, 0.08955992758
]; 
/*
var coefficients = [
0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
]; */


var sectors = 10;
var rings = 10;

var rotation = vec3(0, 0, 0), position = vec3(0, 0, 0), scale = vec3(1, 1, 1);

var FullScreenQuad = null;

var selected = -1;

var animate = true;

function UpdateSelected() {
    
}

function UpdateSelectedInformation() {
   
}

function SetListener(prefix, index)
{
	var nm = index % 9;
	
	var spinFunc = function (event, ui) {
			coefficients[index] = $(prefix + nm).spinner("value")
			gl.uniform3fv(SHLoc, flatten(coefficients));
			render();
		}
		var spinner = $(prefix + nm).spinner({
			spin: spinFunc,
			change: spinFunc,
			stop: spinFunc,
			value: 3.1415911111111,
			step: 0.000001,
			width: 50
		});
		
		$(prefix + nm).spinner("value", coefficients[index]);
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");    

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);


    

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");//load shaders and initialize data
    gl.useProgram(program);

    //location in shaders
    vPos = gl.getAttribLocation(program, "vPosition");
    vNormals = gl.getAttribLocation(program, "vNormal");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

	timeLoc = gl.getUniformLocation(program, "time");
	
	SHLoc =  gl.getUniformLocation(program, "SH");

    auxiliarBuffer_Id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, auxiliarBuffer_Id);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPos);

    
	position = vec3(0, 0, 0);
    FullScreenQuad = new Plane();

    gl.cullFace(gl.BACK);
    
	

    $("#thetaSlider").slider({
        slide: function (event, ui) {
            theta = $("#thetaSlider").slider("value");
        },
        min: 0,
        max: 6.28,
        step: 0.0628,
        value: 0.3
    });
    $("#phiSlider").slider({
        slide: function (event, ui) {
            phi = $("#phiSlider").slider("value");
        },
        min: -1.57,
        max: 1.57,
        step: 0.0628,
        value: phi
    });
    
    var spinFunc=function (event, ui) {
        radius = $("#radius").spinner("value")
    }
    var spinner = $("#radius").spinner({
        spin: spinFunc,
        change: spinFunc,
        stop: spinFunc,
        min: 0.5,
        value: 4.0,
        step: 0.1,
        width: 20
    });

	for (var i = 0; i < 9; ++i)
	{
		SetListener("#r", i);
		SetListener("#g", 9 + i);
		SetListener("#b", 18 + i);
	}
	
	
	//$("#g0").value = 5.2;
	render();

}
 
function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ARRAY_BUFFER, FullScreenQuad.model.buffer);
	gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
	gl.enableVertexAttribArray(vPos);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FullScreenQuad.model.indexes);
	gl.drawElements(gl.TRIANGLES, FullScreenQuad.model.numIndices, gl.UNSIGNED_SHORT, 0);
	
   //requestAnimFrame(render);

}
