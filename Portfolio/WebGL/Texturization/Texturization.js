"use strict";

var canvas;
var gl;
var earthTex = null;
var whetherTex = null;
var sunTex = null;
var modelsList = [];
var earthModel = null;
var sunModel = null;

var time = 0;

//parameters of creation for models

var near = 0.3;
var far = 1000.0;
var fovy = 45;
var aspect = 1.0;

//sun values
var radius = 3.0;
var theta = 3.6;
var phi = 0.0;

var loaded = 0;

var sectors = 10;
var rings = 10;
var rotation = vec3(0, 0, 0), position = vec3(0, 0, 0), scale = vec3(1, 1, 1);

var normalMatrixLoc = null;
var modelMatrixLoc = null;
var viewMatrixLoc = null;
var projectionMatrixLoc = null;
var viewMatrixInverseLoc = null;
var lightPosLoc = null;
var timeLoc = null;

var vPos = null;
var vNormals = null;
var vUV = null;


var snormalMatrixLoc = null;
var smodelMatrixLoc = null;
var sviewMatrixLoc = null;
var sprojectionMatrixLoc = null;
var sviewMatrixInverseLoc = null;
var stimeLoc = null;

var svPos = null;
var svNormals = null;
var svUV = null;

var earthProgram, sunProgram;

var camera = null;

function Texture(path) {
    this.loc = null;
    this.texture = null;
    LoadTexture(path, this);
}

function LoadTexture(path,obj) {
    var image = new Image();
    image.onload = function () {
        obj.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, obj.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        loaded++;
    }
    image.src = path;
}
/*
function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function steupTextureFilteringAndMips(width, height) {
    if (isPowerOf2(width) && isPowerOf2(height)) {
        // the dimensions are power of 2 so generate mips and turn on 
        // tri-linear filtering.
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
        // at least one of the dimensions is not a power of 2 so set the filtering
        // so WebGL will render it.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
}*/




function toClipSpace(v) {
    var rect = canvas.getBoundingClientRect();
    return vec2(2 * (v[0] - rect.left) / canvas.width - 1,
           2 * (canvas.height - (v[1]- rect.top)) / canvas.height - 1);
}



window.onload = function init() {
    canvas = document.getElementById("gl-canvas");    

    aspect = canvas.width / canvas.height;

    camera = new CameraController(canvas);

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    earthProgram = initShaders(gl, "vertex-shader", "fragment-shader");//load shaders and initialize data
    gl.useProgram(earthProgram);

    earthTex = new Texture("earth.png");
    whetherTex = new Texture("atmosphere.png");

    earthTex.loc = gl.getUniformLocation(earthProgram, "earth");
    whetherTex.loc = gl.getUniformLocation(earthProgram, "atmosphere");

    modelMatrixLoc = gl.getUniformLocation(earthProgram, "modelMatrix");
    viewMatrixLoc = gl.getUniformLocation(earthProgram, "viewMatrix");
    viewMatrixInverseLoc = gl.getUniformLocation(earthProgram, "viewInverseMatrix");
    projectionMatrixLoc = gl.getUniformLocation(earthProgram, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(earthProgram, "normalMatrix");

    lightPosLoc = gl.getUniformLocation(earthProgram, "lightPos");
    timeLoc = gl.getUniformLocation(earthProgram, "time");

    vPos = gl.getAttribLocation(earthProgram, "vPosition");
    vNormals = gl.getAttribLocation(earthProgram, "vNormals");
    vUV = gl.getAttribLocation(earthProgram, "vUV");

    ///////////shader 2

    sunProgram = initShaders(gl, "vertex-shaderSun", "fragment-shaderSun");//load shaders and initialize data
    gl.useProgram(sunProgram);

    sunTex = new Texture("sun.jpg");

    sunTex.loc = gl.getUniformLocation(sunProgram, "sun");

    smodelMatrixLoc = gl.getUniformLocation(sunProgram, "modelMatrix");
    sviewMatrixLoc = gl.getUniformLocation(sunProgram, "viewMatrix");
    sviewMatrixInverseLoc = gl.getUniformLocation(sunProgram, "viewInverseMatrix");
    sprojectionMatrixLoc = gl.getUniformLocation(sunProgram, "projectionMatrix");
    snormalMatrixLoc = gl.getUniformLocation(sunProgram, "normalMatrix");

    stimeLoc = gl.getUniformLocation(sunProgram, "time");

    svPos = gl.getAttribLocation(sunProgram, "vPosition");
    svNormals = gl.getAttribLocation(sunProgram, "vNormals");
    svUV = gl.getAttribLocation(sunProgram, "vUV");

    const nvert = 30;

    scale = vec3(2.0, 2.0, 2.0);
    earthModel = new Sphere(nvert, nvert, 0.5);

    scale = vec3(1.0,1.0,1.0);
    sunModel = new Sphere(nvert, nvert, 0.5);




    $("#thetaSlider").slider({
        slide: function (event, ui) {
            theta = $("#thetaSlider").slider("value");
            render(true);
        },
        min: 0,
        max: 6.28,
        step: 0.0628,
        value: theta
    });
    $("#phiSlider").slider({
        slide: function (event, ui) {
            phi = $("#phiSlider").slider("value");
            render(true);
        },
        min: -1.57,
        max: 1.57,
        step: 0.0628,
        value: phi
    });

    var spinFunc = function (event, ui) {
        radius = $("#radius").spinner("value")
    }
    var spinner = $("#radius").spinner({
        spin: spinFunc,
        change: spinFunc,
        stop: spinFunc,
        min: 1,
        value: radius,
        step: 0.1,
        width: 20
    });

    camera.radius = 5.5;

    gl.cullFace(gl.BACK);

    render();
}


var lastUpdate = Date.now();

function render() {
    var now = Date.now();
    var dt = now - lastUpdate;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var transl = translate(vec3(0, 0, -radius));
    var srotX = rotate(-degrees(phi), vec3(1, 0, 0));
    var srotY = rotate(-degrees(theta), vec3(0, 1, 0));
    var strot = mult(srotY,transl);
    var MSun = mult(srotX, strot);
    //var MSun = mult(translate(vec3(0, 0, -radius)), srot);

    var sunPos = vec3(MSun[0][3], MSun[1][3], MSun[2][3]);

    gl.useProgram(earthProgram);

    gl.uniform3fv(lightPosLoc, flatten(sunPos));

    var rotX = rotate(-degrees(camera.xRot), vec3(1, 0, 0));
    var rotY = rotate(-degrees(camera.yRot), vec3(0, 1, 0));
    var mrot = mult(rotX, rotY);
    var View = mult(translate(vec3(0, 0, -camera.radius)), mrot);

    var projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(View));
    time += dt/20000.0;
   // console.log(dt/20000);
    var iview = inverse(View);
    gl.uniform1f(timeLoc,time);
    var obj = earthModel;

    var Model = obj.instance.Mat;
   // var MV = mult(View, Model);
    var normalMat = normalMatrix(Model, true);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(Model));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMat));
    gl.uniformMatrix4fv(viewMatrixInverseLoc, false, flatten(iview));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.model.buffer);
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPos);

    gl.vertexAttribPointer(vNormals, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(vNormals);

    gl.vertexAttribPointer(vUV, 2, gl.FLOAT, false, 32, 24);
    gl.enableVertexAttribArray(vUV);

   // if (loaded>=2) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, earthTex.texture);
        gl.uniform1i(earthTex.loc, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, whetherTex.texture);
        gl.uniform1i(whetherTex.loc, 1);
  //  }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.model.indexes);
    gl.drawElements(gl.TRIANGLES, obj.model.numIndices, gl.UNSIGNED_SHORT, 0);

    //rendering sun
    gl.useProgram(sunProgram);

    gl.uniformMatrix4fv(sprojectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(sviewMatrixLoc, false, flatten(View));
    gl.uniformMatrix4fv(sviewMatrixInverseLoc, false, flatten(iview));
    gl.uniform1f(stimeLoc, time);

    var snormalMat = normalMatrix(MSun, true);
    gl.uniformMatrix4fv(smodelMatrixLoc, false, flatten(MSun));
    gl.uniformMatrix3fv(snormalMatrixLoc, false, flatten(snormalMat));

    gl.bindBuffer(gl.ARRAY_BUFFER, sunModel.model.buffer);
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(svPos);

    gl.vertexAttribPointer(vNormals, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(svNormals);

    gl.vertexAttribPointer(vUV, 2, gl.FLOAT, false, 32, 24);
    gl.enableVertexAttribArray(svUV);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sunTex.texture);
    gl.uniform1i(sunTex.loc, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sunModel.model.indexes);
    gl.drawElements(gl.TRIANGLES, sunModel.model.numIndices, gl.UNSIGNED_SHORT, 0);

    requestAnimFrame(render);
    lastUpdate = now;
}
