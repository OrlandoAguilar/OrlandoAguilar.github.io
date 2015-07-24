"use strict";

var canvas;
var gl;

var color = 0x66ff00;
var maxNumVertices = 10240;
var index = 0;
var colorPosition = 0;
var auxiliarBuffer_Id = 0;
var thickness = 10;
var vPos;

function vSub(v1, v2) {
    var result = [];
    for (var i = 0; i < v1.length; ++i) {
        result.push(v1[i] - v2[i]);
    }
    return result;
}

function vAdd(v1, v2) {
    var result = [];
    for (var i = 0; i < v1.length; ++i) {
        result.push(v1[i] + v2[i]);
    }
    return result;
}

function vDiv(v1, v) {
    var result = [];
    for (var i = 0; i < v1.length; ++i) {
        result.push(v1[i] / v);
    }
    return result;
}

function vMul(v1, v) {
    var result = [];
    for (var i = 0; i < v1.length; ++i) {
        result.push(v1[i] * v);
    }
    return result;
}

function toClipSpace(v) {
    var rect = canvas.getBoundingClientRect();
    return vec2(2 * (v[0] - rect.left) / canvas.width - 1,
           2 * (canvas.height - (v[1]- rect.top)) / canvas.height - 1);
}


function Stroke(color, thickness) {
    this.color = color;
    this.thickness = thickness;
    this.lastPoint =null;
    this.index = 0;
    this.vArray;
    this.buffer=0;
    this.data=null;

    this.StartStroke = function (p2) {
            this.index = 0;
            index = 0;
            this.data = [];
    }

    this.EndStroke = function () {
        
        this.data.push(this.vArray[0]);
        this.data.push(this.vArray[1]);

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.data), gl.STATIC_DRAW);

        this.data = null;
        this.lastPoint = null;
        this.vArray = null;
        index = 0;
        
    }

    this.AddPoint = function (p2) {
        if (this.index == 0) {
            this.lastPoint = p2;
            var vCs = toClipSpace(p2);
            this.vArray = [vCs, vCs];
            gl.bindBuffer(gl.ARRAY_BUFFER, auxiliarBuffer_Id);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.vArray));
            this.index = 2;
            index = 2;
            return;
        }
        if (this.index + 3 > maxNumVertices || !this.lastPoint) return;
        var p1=this.lastPoint;
        this.lastPoint = p2;
        var v = vSub(p2, p1);
        v = normalize(v);  // make it a unit vector

        var  vp=vec2(-v[1], v[0]);  // compute the vector perpendicular to v

        var W_2_vp = vMul(vp,this.thickness);

        var vp1=toClipSpace(vAdd(p1, W_2_vp));
        var vp2=toClipSpace(vSub(p1, W_2_vp));
        var vp3 = toClipSpace(vAdd(p2, W_2_vp));
        var vp4 = toClipSpace(vSub(p2, W_2_vp));

        this.vArray[0] = mix(this.vArray[0], vp1, 0.5); //interpolation between junction points
        this.vArray[1] = mix(this.vArray[1], vp2, 0.5);
        this.vArray[2] = vp3;
        this.vArray[3] = vp4;

        this.data.push(this.vArray[0]);     //save the data for the creating the static buffer
        this.data.push(this.vArray[1]);


        gl.bindBuffer(gl.ARRAY_BUFFER, auxiliarBuffer_Id);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (this.index-2), flatten(this.vArray));    //updates from last 2 elements, as I have softened them for the next 2
        
        this.index += 2;

        index = this.index;
        this.vArray.splice(0, 2);       //keep last two elements for softening later
        
        return this;
    }
}

function color2fvec(color) {
    var r = ((color >> 16) & 0xFF) / 255.0;
    var g = ((color >> 8) & 0xFF) / 255.0;
    var b = (color & 0xFF) / 255.0;
    return vec4(r,g,b,1);
}

var strokeManager = new function () {
    this.strokes = [];
    this.stroke = null;

    this.StartStroke=function(p1){
        this.stroke = new Stroke(color, thickness);
        this.stroke.StartStroke(p1);
        
    }

    this.EndStroke = function () {
        if (!this.stroke) return;
        if (this.stroke.data.length > 0) {
            this.stroke.EndStroke();
            this.strokes.push(this.stroke);
        }
        this.stroke = null;
    }

    this.AddPoint = function (v) {
        if (!this.stroke) return;
        if (this.stroke.index + 3 > maxNumVertices) {
            var arr = this.stroke.lastPoint;

            this.EndStroke();
            console.log(arr);
            this.StartStroke(arr)

        }
        this.stroke.AddPoint(v);
    }
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    document.getElementById("colorPicker").onchange = function () { color = parseInt(this.value, 16); };
    document.getElementById("thicknesSlider").onchange = function (event) { thickness = parseInt(this.value, 10); };
    

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    canvas.addEventListener("mousedown", function (event) {
        var t = vec2(event.clientX, event.clientY);
        strokeManager.StartStroke(t);
        render();
    });

    canvas.addEventListener("mousemove", function (event) {
        var t = vec2(event.clientX, event.clientY);
        strokeManager.AddPoint(t);
        render();
    });

    canvas.addEventListener("mouseup", function (event) {
        strokeManager.EndStroke();
        render();
    });
    
    canvas.addEventListener("mouseout", function (event) {
        strokeManager.EndStroke();
        render();
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    var program = initShaders(gl, "vertex-shader", "fragment-shader");//load shaders and initialize data
    gl.useProgram(program);

    auxiliarBuffer_Id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, auxiliarBuffer_Id);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.DYNAMIC_DRAW);
    vPos = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);

 
    colorPosition = gl.getUniformLocation(program, "color");
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i=0; i< strokeManager.strokes.length; i++) {      //draw all complete strokes
        var stroke = strokeManager.strokes[i];

        gl.bindBuffer(gl.ARRAY_BUFFER, stroke.buffer);
        gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);

        gl.uniform4fv(colorPosition, flatten(color2fvec(stroke.color)));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, stroke.index);
    }
    
    if (index > 2) {        //draw no complete stroke
        gl.bindBuffer(gl.ARRAY_BUFFER, auxiliarBuffer_Id);
        gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
        gl.uniform4fv(colorPosition, flatten(color2fvec(color)));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, index);

    }

}
