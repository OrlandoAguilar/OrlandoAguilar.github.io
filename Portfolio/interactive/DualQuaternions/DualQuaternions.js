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

var lightConeDirection2Loc = null;

var shininessMaterialLoc = null;
var specularMaterialLoc = null;
var diffuseMaterialLoc = null;

var timeLoc = null;

var wireframeLoc = null;

var modelViewMatrix;
var projectionMatrix;


var near = 0.3;
var far = 1000.0;
var radius = 8.0;
var theta = 0.0;
var phi = -1.1;


const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var objectTypeToCreate=SPHERE;

var fovy = 45;
var aspect;

var sectors = 10;
var rings = 10;

var rotation = vec3(0, 0, 0), position = vec3(0, 0, 0), scale = vec3(1, 1, 1);

var modelsList = [];
var selected = -1;

var Light = [];

var animate = true;

function UpdateSelected() {
    
}

function UpdateSelectedInformation() {
   
}



window.onload = function init() {
    canvas = document.getElementById("gl-canvas");    

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);


    aspect = canvas.width / canvas.height;

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
	
    LightPosLoc[0] = gl.getUniformLocation(program, "lightPosition1");
    LightPosLoc[1] = gl.getUniformLocation(program, "lightPosition2");
    LightPosLoc[2] = gl.getUniformLocation(program, "lightPosition3");

    diffuseLightLoc[0] = gl.getUniformLocation(program, "diffuseLight1");
    diffuseLightLoc[1] = gl.getUniformLocation(program, "diffuseLight2");
    diffuseLightLoc[2] = gl.getUniformLocation(program, "diffuseLight3");

    specularLightLoc[0] = gl.getUniformLocation(program, "specularLight1");
    specularLightLoc[1] = gl.getUniformLocation(program, "specularLight2");
    specularLightLoc[2] = gl.getUniformLocation(program, "specularLight3");

    activeLightLoc[0] = gl.getUniformLocation(program, "activeLight0");
    activeLightLoc[1] = gl.getUniformLocation(program, "activeLight1");
    activeLightLoc[2] = gl.getUniformLocation(program, "activeLight2");

    lightConeDirection2Loc = gl.getUniformLocation(program, "lightConeDirection2");

    diffuseMaterialLoc = gl.getUniformLocation(program, "diffuseMaterial");
    specularMaterialLoc = gl.getUniformLocation(program, "specularMaterial");
    shininessMaterialLoc = gl.getUniformLocation(program, "shininessMaterial");

    wireframeLoc = gl.getUniformLocation(program, "wireframe");

    auxiliarBuffer_Id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, auxiliarBuffer_Id);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPos);

    gl.vertexAttribPointer(vNormals, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(vNormals);

    

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

	position = vec3(-1.2, 2, -1.2);
    Light[0] = new Cylinder(5, 0.2);
    Light[0].instance.type = LIGHT;
    Light[0].instance.specular = vec3(0, 0.5, 0);
    Light[0].instance.diffuse = vec3(0, 0.5, 0);
    Light[0].instance.distance = -1.0;
    modelsList.push(Light[0]);

    position = vec3(1.5, 2, 0);
    Light[1] = new Cone(5,0.2);
    Light[1].instance.type = LIGHT;
    Light[1].instance.specular = vec3(1, 0, 0);
    Light[1].instance.diffuse = vec3(1, 0, 0);
    Light[1].instance.distance = 4.5;
    modelsList.push(Light[1]);

    position = vec3(0.0, 2, 1.5);
    Light[2] = new Sphere(5, 5,0.2);
    Light[2].instance.type = LIGHT;
    Light[2].instance.diffuse = vec3(0, 0, 1);
    Light[2].instance.specular = vec3(0, 0, 1);
    Light[2].instance.distance = 8.0;
    modelsList.push(Light[2]);

    position = vec3(0, 0, 0);
    var m = new Sphere(30, 30,0.5);
    modelsList.push(m);

    position = vec3(0);
    scale = vec3(1,1,1);

    selected = modelsList.length - 1;
    gl.cullFace(gl.BACK);
    render();
}

var thetaAnim = 0.0;

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var rotX = rotate(-degrees(phi), vec3(1, 0, 0));
    var rotY = rotate(-degrees(theta), vec3(0, 1, 0));
    var mrot=mult(rotX,rotY);
    var View = mult(translate(vec3(0, 0, -radius)), mrot);

    var projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    if (animate) {
        thetaAnim += 0.01;
    }

	gl.uniform1f(timeLoc, thetaAnim);
	
    for (var i0 = 0; i0 < 3; ++i0) {        //only send them once in the beggining of the frame. They dont change with the objects
        var th =  i0*2.09;//thetaAnim + no animations
        Light[i0].instance.position = vec3(Math.cos(th) * 1.5, 1.5, Math.sin(th) * 1.5);
        Light[i0].instance.Update();

        var ligthP = mult(View, vec4(Light[i0].instance.position, Light[i0].instance.distance>0));
        ligthP[3] = Light[i0].instance.distance;
        gl.uniform4fv(LightPosLoc[i0], flatten(ligthP));
        gl.uniform3fv(diffuseLightLoc[i0], flatten(Light[i0].instance.diffuse));
        gl.uniform3fv(specularLightLoc[i0], flatten(Light[i0].instance.specular));
        gl.uniform1i(activeLightLoc[i0], activeLight[i0]);
    }

    var mlight = mult(View, Light[1].instance.Mat);
    var dir = vec3(mult(mlight, vec4(0, -1, 0, 0)));
    gl.uniform3fv(lightConeDirection2Loc, flatten(dir));

    for (var z = 0; z < modelsList.length; ++z) {
        var obj = modelsList[z];

        var Model = obj.instance.Mat;
        var MV = mult(View, Model);
        var normalMat = normalMatrix(MV,true);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(MV));
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMat));

        gl.uniform3fv(diffuseMaterialLoc, flatten(obj.instance.diffuse));
        gl.uniform3fv(specularMaterialLoc, flatten(obj.instance.specular));
        gl.uniform1f(shininessMaterialLoc, obj.instance.shininess);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.model.buffer);
        gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(vPos);

        gl.vertexAttribPointer(vNormals, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(vNormals);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.model.indexes);
        gl.drawElements(gl.TRIANGLES, obj.model.numIndices, gl.UNSIGNED_SHORT, 0);
        

    }
       requestAnimFrame(render);

}
