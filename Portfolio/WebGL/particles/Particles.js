"use strict";

var canvas;
var gl;
var texture = null;
var texture2 = null;
var drawTexture = null;
var particleModel = null;

var time = 0;

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

var program;

var camera = null;

var vTextureCoordinates = null;
var vIndex = null;
var vPosition = null;

var modelMatrixLoc = null;
var viewMatrixLoc = null;
var projectionMatrixLoc = null;
var viewMatrixInverseLoc = null;
var timeLoc;

var indexBuffer = null;
var instanceCount = 1000;
var ext = null;

var projectionMatrix = null;

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


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");    

    aspect = canvas.width / canvas.height;

    camera = new CameraController(canvas);

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    gl.viewport(0, 0, canvas.width, canvas.height);
    //gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");//load shaders and initialize data
    gl.useProgram(program);

    texture = new Texture("pump_star_05.png");
    texture2 = new Texture("pump_star_03.png");

    texture.loc = gl.getUniformLocation(program, "texture");
    texture2.loc = texture.loc;

    drawTexture = texture;

    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    viewMatrixInverseLoc = gl.getUniformLocation(program, "viewInverseMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");


    timeLoc = gl.getUniformLocation(program, "time");

    vPosition = gl.getAttribLocation(program, "vPosition");
    vIndex = gl.getAttribLocation(program, "vIndex");
    vTextureCoordinates = gl.getAttribLocation(program, "vTextureCoordinates");

  
    particleModel = new Plane();

    camera.radius = 8.5;
    camera.xRot = 1.2;

    gl.cullFace(gl.BACK);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    ext = gl.getExtension("ANGLE_instanced_arrays"); // Vendor prefixes may apply!

    var indexes = new Float32Array(instanceCount);
    for (var i = 0; i < indexes.length; ++i) indexes[i] = i;

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, indexes, gl.STATIC_DRAW);

    projectionMatrix = perspective(fovy, aspect, near, far);

    $("#t1").on("click", function (e) {
        drawTexture = texture;
    });

    $("#t2").on("click", function (e) {
        drawTexture = texture2;
    });

    render();
}


var lastUpdate = Date.now();

function render() {
    var now = Date.now();
    var dt = now - lastUpdate;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    var rotX = rotate(-degrees(camera.xRot), vec3(1, 0, 0));
    var rotY = rotate(-degrees(camera.yRot), vec3(0, 1, 0));
    var mrot = mult(rotX, rotY);
    var View = mult(translate(vec3(0, -3.0, -camera.radius)), mrot);

    

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(View));
    time += dt/20000.0;

    var iview = inverse(View);
    gl.uniform1f(timeLoc,time);
    var obj = particleModel;

    var Model = obj.instance.Mat;
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(Model));
    gl.uniformMatrix4fv(viewMatrixInverseLoc, false, flatten(iview));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.model.buffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.vertexAttribPointer(vTextureCoordinates, 2, gl.FLOAT, false, 32, 24);
    gl.enableVertexAttribArray(vTextureCoordinates);

    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.vertexAttribPointer(vIndex, 1, gl.FLOAT, false, 4, 0);
    gl.enableVertexAttribArray(vIndex);
    ext.vertexAttribDivisorANGLE(vIndex, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, drawTexture.texture);
    gl.uniform1i(drawTexture.loc, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.model.indexes);
    ext.drawElementsInstancedANGLE(gl.TRIANGLES, obj.model.numIndices, gl.UNSIGNED_SHORT, 0, instanceCount);

    requestAnimFrame(render);
    lastUpdate = now;
}
