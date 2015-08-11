"use strict";

//erase
var line;
const BY_STEPS=1;
const AUTOMATIC=0;
var mode = AUTOMATIC;

var canvas;
var gl;

var color = 0x66ff00;
var maxNumVertices = 10240;
var index = 0;
var colorPosition = 0;
var auxiliarBuffer_Id = 0;
var thickness = 10;
var vPos;
var nPos;
var modelMatrixLoc = 0;
var viewMatrixLoc = 0;
var projectionMatrixLoc=0;
var modelViewMatrix;
var projectionMatrix;
var wireLoc;

var near = 0.3;
var far = 1000.0;
var radius = 5.0;
var theta = 0.0;
var phi = 0;

var vector;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

const SPHERE=1;
const CONE=2;
const CYLINDER=3;

var objectTypeToCreate=SPHERE;

var fovy = 45;
var aspect;

var sectors = 10;
var rings = 10;

var rotation = vec3(0, 0, 0), position = vec3(0, 0, 0), scale = vec3(1, 1, 1);

var modelsList = [];
var selected = -1;

function degrees(rad) {
    return rad * 180.0 / Math.PI;
}

function toClipSpace(v) {
    var rect = canvas.getBoundingClientRect();
    return vec2(2 * (v[0] - rect.left) / canvas.width - 1,
           2 * (canvas.height - (v[1]- rect.top)) / canvas.height - 1);
}


function color2fvec(color) {
    var r = ((color >> 16) & 0xFF) / 255.0;
    var g = ((color >> 8) & 0xFF) / 255.0;
    var b = (color & 0xFF) / 255.0;
    return vec4(r,g,b,1);
}

function vec2htmColor(color) {
    return (Math.floor(color[0]*255) << 16) | (Math.floor(color[1]*255) << 8) | Math.floor(color[2]*255);
}



function Instance() {
        this.Mat = mat4();
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.update = false;
        this.model = null;
        this.color = color2fvec(color);
        this.colliding = false;
    this.Update =function() {
        var rotX=rotate(this.rotation[0],vec3(1,0,0));
        var rotY=rotate(this.rotation[1],vec3(0,1,0));
        var rotZ=rotate(this.rotation[2],vec3(0,0,1));
        var mrot=mult(rotZ,mult(rotY,rotX));
        this.Mat = mult(translate(this.position), mult(mrot, scalem(this.scale)));
        this.update = false;
    }
}

function Model() {
    this.buffer = 0;
    this.indexes = 0;
    this.type = 0;
    this.numIndices = 0;
    this.vertices = [];
}

var spheres = [];

function Sphere (rings, sectors){
        const radius = 0.5;
        var hash = rings << 8 | sectors;
        
        if (spheres[hash]) {
            this.model = spheres[hash];
        } else {
            //create the model and save it on the hashtable
            this.model=new Model();
            this.model.type=SPHERE;

            var PI = 3.1415926535897;
            var PI_2 = 3.1415926535897 / 2;
   
            var indices=new Array(rings * sectors * 6);

            var data=new Array(rings * sectors * 8);

 
            var R = 1.0 / (rings - 1);
            var S = 1.0 / (sectors - 1);
            var r, s;

            var index=-1;

            for (r = 0; r < rings; r++) for (s = 0; s < sectors; s++) {
                var y = (Math.sin(-PI_2 + PI * r * R));
                var x = (Math.cos(2 * PI * s * S) * Math.sin(PI * r * R));
                var z = (Math.sin(2 * PI * s * S) * Math.sin(PI * r * R));

                var ver = vec3();
                //vertices
                ver[0] = data[++index] = x * radius;
                ver[1] = data[++index] = y * radius;
                ver[2] = data[++index] = z * radius;
				
                this.model.vertices.push(ver);

                //normal
                data[++index] = x;
                data[++index] = y;
                data[++index] = z;
					
                //texture coordinates			
                data[++index] = s*S;
                data[++index] = r*R;
            }

            index=-1;
            for (r = 0; r < rings - 1; r++) for (s = 0; s < sectors - 1; s++) {
                indices[++index] = r * sectors + s;
                indices[++index] = r * sectors + (s + 1);
                indices[++index] = (r + 1) * sectors + (s + 1);
                indices[++index] = (r + 1) * sectors + (s + 1);
                indices[++index] = (r + 1) * sectors + s;
                indices[++index] = r * sectors + s;
            }

            //data buffer
            this.model.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

            //index buffer

            this.model.indexes = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexes);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indices), gl.STATIC_DRAW);

            this.model.numIndices = indices.length;

            spheres[hash] = this.model;
        }

        this.instance = new Instance();
       
        this.instance.position = position;
        this.instance.rotation = rotation;
        this.instance.scale = scale;
        this.instance.Update();
}


var cones = [];     //hash table for cones

function Cone(sectors,rad) {
    const rings = 3;
    var hash = sectors;

    if (cones[hash]) {
        this.model = cones[hash];
    } else {
        //create the model and save it on the hashtable
        this.model = new Model();
        this.model.type = CONE;

        var PI = 3.1415926535897;
        var PI_2 = 3.1415926535897 / 2;

        var indices = new Array(sectors * 6);

        var data = new Array(rings * sectors * 8);


        var R = 1.0 / (rings - 1);
        var S = 1.0 / (sectors - 1);
        var r, s;

        var index = -1;
        r = 0;
        var radius = 0;
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S) ;
            var z = Math.sin(2 * PI * s * S) ;

            var ver = vec3();

            //vertices
            ver[0] = data[++index] = x * radius;
            ver[1] = data[++index] = 0.5;
            ver[2] = data[++index] = z * radius;
            this.model.vertices.push(ver);
            //normal
            data[++index] = x/1.4112;
            data[++index] = 1 / 1.4112;
            data[++index] = z / 1.4112;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        r = 1;
        var radius = 0.5;
        if (rad) {
            radius = rad / 2;
        }
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            var ver = vec3();
            //vertices
            ver[0] = data[++index] = x * radius;
            ver[1] = data[++index] = -0.5;
            ver[2] = data[++index] = z * radius;
            this.model.vertices.push(ver);
            //normal
            data[++index] = x ;
            data[++index] = 0 ;
            data[++index] = z ;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        r = 3;
        var radius = 0;
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            var ver = vec3();
            //vertices
            ver[0] = data[++index] = x * radius;
            ver[1] = data[++index] = -0.5;
            ver[2] = data[++index] = z * radius;
            this.model.vertices.push(ver);
            //normal
            data[++index] = 0;
            data[++index] = -1;
            data[++index] = 0;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        index = -1;
        for (r = 0; r < rings - 1; r++) for (s = 0; s < sectors - 1; s++) {
            indices[++index] = r * sectors + s;
            indices[++index] = r * sectors + (s + 1);
            indices[++index] = (r + 1) * sectors + (s + 1);
            indices[++index] = (r + 1) * sectors + (s + 1);
            indices[++index] = (r + 1) * sectors + s;
            indices[++index] = r * sectors + s;
        }

        //data buffer
        this.model.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

        //index buffer

        this.model.indexes = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexes);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indices), gl.STATIC_DRAW);

        this.model.numIndices = indices.length;

        cones[hash] = this.model;
    }

    this.instance = new Instance();

    this.instance.position = position;
    this.instance.rotation = rotation;
    this.instance.scale = scale;
    this.instance.Update();
}


var cylinders = [];     //hash table for cones

function Cylinder(sectors) {
    const rings = 4;
    var hash = sectors;

    if (cylinders[hash]) {
        this.model = cylinders[hash];
    } else {
        //create the model and save it on the hashtable
        this.model = new Model();
        this.model.type = CYLINDER;

        var PI = 3.1415926535897;
        var PI_2 = 3.1415926535897 / 2;

        var indices = new Array(sectors * 6);

        var data = new Array(rings * sectors * 8);


        var R = 1.0 / (rings - 1);
        var S = 1.0 / (sectors - 1);
        var r, s;

        var index = -1;
        r = 0;
        var radius = 0;
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            var ver = vec3();
            //vertices
            ver[0] = data[++index] = x * radius;
            ver[1] = data[++index] = 0.5;
            ver[2] = data[++index] = z * radius;
            this.model.vertices.push(ver);
            //normal
            data[++index] = 0;
            data[++index] = 1;
            data[++index] = 0;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        var radius = 0.5;
        for (r = 1; r <= 2;++r)
        for (s = 0; s < sectors; s++) {
            var y = 1.5-r;
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            var ver = vec3();
            //vertices
            ver[0] = data[++index] = x * radius;
            ver[1] = data[++index] = y;
            ver[2] = data[++index] = z * radius;
            this.model.vertices.push(ver);
            //normal
            data[++index] = x;
            data[++index] = 0;
            data[++index] = z;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        r = 3;
        var radius = 0;
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            var ver = vec3();
            //vertices
            ver[0] = data[++index] = x * radius;
            ver[1] = data[++index] = -0.5;
            ver[2] = data[++index] = z * radius;
            this.model.vertices.push(ver);
            //normal
            data[++index] = 0;
            data[++index] = -1;
            data[++index] = 0;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        index = -1;
        for (r = 0; r < rings - 1; r++) for (s = 0; s < sectors - 1; s++) {
            indices[++index] = r * sectors + s;
            indices[++index] = r * sectors + (s + 1);
            indices[++index] = (r + 1) * sectors + (s + 1);
            indices[++index] = (r + 1) * sectors + (s + 1);
            indices[++index] = (r + 1) * sectors + s;
            indices[++index] = r * sectors + s;
        }

        //data buffer
        this.model.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

        //index buffer

        this.model.indexes = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexes);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indices), gl.STATIC_DRAW);

        this.model.numIndices = indices.length;

        cylinders[hash] = this.model;
    }

    this.instance = new Instance();

    this.instance.position = position;
    this.instance.rotation = rotation;
    this.instance.scale = scale;
    this.instance.Update();
}

function UpdateSelected() {
    if (selected==-1)
        return;
    var sel = modelsList[selected];
    if (sel) {
        sel.instance.position = position;
        sel.instance.rotation = rotation;
        sel.instance.scale = scale;
        sel.instance.color = color2fvec(color);
        sel.instance.Update();
    }
}

function UpdateSelectedInformation() {
    if (selected == -1)
        return;
    var sl = selected;
    var sel = modelsList[selected];
    if (sel) {
        selected = -1;
        var p=sel.instance.position;
        var r=sel.instance.rotation;
        var s=sel.instance.scale;
        var c = sel.instance.color;
        $("#tx").spinner("value", p[0]);
        $("#ty").spinner("value", p[1]);
        $("#tz").spinner("value", p[2]);

        $("#rx").spinner("value", r[0]);
        $("#ry").spinner("value", r[1]);
        $("#rz").spinner("value", r[2]);

        $("#sx").spinner("value", s[0]);
        $("#sy").spinner("value", s[1]);
        $("#sz").spinner("value", s[2]);

        document.getElementById("colorPicker").color.fromRGB(c[0],c[1],c[2]);
        selected = sl;
        position = p;
        scale = s;
        rotation = r;
        color = vec2htmColor(c);
    }
}

var simplex = new Simplex();
var epa = new EPA();

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

    auxiliarBuffer_Id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, auxiliarBuffer_Id);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.DYNAMIC_DRAW);
    vPos = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPos);


    /*nPos = gl.getAttribLocation(program, "nPosition");
    gl.vertexAttribPointer(nPos, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(nPos);
    */
    colorPosition = gl.getUniformLocation(program, "color");
    wireLoc = gl.getUniformLocation(program, "wire");
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    

    $("#thetaSlider").slider({
        slide: function (event, ui) {
            theta = $("#thetaSlider").slider("value");
            render(true);
        },
        min: 0,
        max: 6.28,
        step: 0.0628,
        value: 0.3
    });
    $("#phiSlider").slider({
        slide: function (event, ui) {
            phi = $("#phiSlider").slider("value");
            render(true);
        },
        min: -1.57,
        max: 1.57,
        step: 0.0628,
        value: 0
    });
    
    var spinFunc=function (event, ui) {
        radius = $("#radius").spinner("value")
        render(true);
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


    var trasFunc = function (event, ui) {
        position = vec3($("#tx").spinner("value"), $("#ty").spinner("value"), $("#tz").spinner("value"));
        UpdateSelected();
    }
    $("#tx,#ty,#tz").spinner({
        spin: trasFunc,
        change: trasFunc,
        stop: trasFunc,
        value: 0,
        step: 0.025
        
    });

    var rotFunc = function (event, ui) {
        rotation = vec3($("#rx").spinner("value"), $("#ry").spinner("value"), $("#rz").spinner("value"));
        UpdateSelected();
    }
    $("#rx,#ry,#rz").spinner({
        spin: rotFunc,
        change: rotFunc,
        stop: rotFunc,
        value: 0,
        step: 10,
        width: 20
    });

    var sclFunc = function (event, ui) {
        scale = vec3($("#sx").spinner("value"), $("#sy").spinner("value"), $("#sz").spinner("value"));
        UpdateSelected();
    }
    $("#sx,#sy,#sz").spinner({
        spin: sclFunc,
        change: sclFunc,
        stop: sclFunc,
        step: 0.025,
        width: 20
    });

    var selObjects = function (event, data) {
        objectTypeToCreate = parseInt(data.item.value);
        if (objectTypeToCreate == SPHERE) {
            //document.getElementById("ringsSpace").hidden = false;
            $("#rings").spinner("enable");
        } else {
           // document.getElementById("ringsSpace").hidden = true;
            $("#rings").spinner("disable");
        }
    }
    $("#objects").selectmenu({
        select: selObjects,
        change: selObjects,
        width: 150
    });

    document.getElementById("colorPicker").onchange = function () { color = parseInt(this.value, 16); UpdateSelected(); };

    var ringsSectorsFunc = function (event, ui) {
        rings = $("#rings").spinner("value");
        sectors = $("#sectors").spinner("value");
    }
    $("#rings,#sectors").spinner({
        spin: ringsSectorsFunc,
        change: ringsSectorsFunc,
        stop: ringsSectorsFunc,
        value: 10,
        step: 1,
        min: 4,
        max: 50,
        width: 20
    });

    $("#buttonInsert").on("click", function (e) {
        var sel = null;
        switch (objectTypeToCreate) {
            case SPHERE:
                sel = new Sphere(rings, sectors);
                break;
            case CONE:
                sel = new Cone(sectors);
                break;
            case CYLINDER:
                sel = new Cylinder(sectors);
                break;
        }

        modelsList.push(sel);
        selected = modelsList.length-1;
    });

    $("#previous").on("click", function (e) {
        selected--;
        if (selected<0)
            selected = modelsList.length - 1;
        UpdateSelectedInformation();
    });

    $("#next").on("click", function (e) {
        selected++;
        if (selected>=modelsList.length)
            selected = 0;
        UpdateSelectedInformation();
    });


    position = vec3(0,0, 0);
    var sel = new Cylinder(10);
    modelsList.push(sel);

    position = vec3(0.8, 0.0, 0.0);
    sel = new Cone(10);
    modelsList.push(sel);

    selected = 1;

    vector = new Cone(5,0.2);

    line = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, line);
    gl.bufferData(gl.ARRAY_BUFFER, 32*4, gl.STATIC_DRAW);

    $("#render").on("click", function (e) {

        if (mode==AUTOMATIC && simplex.CollisionDetection(modelsList[0], modelsList[1])) {
            modelsList[0].instance.colliding = true;
            modelsList[1].instance.colliding = true;
            epa.Restart(simplex);
        }
        mode = BY_STEPS;
            render();
    });

    $("#automatic").on("click", function (e) {
        renderG();
        mode = AUTOMATIC;
    });
    simplex.CollisionDetection(modelsList[0], modelsList[1]);
    epa.start(simplex);

    gl.enable(0x8642);

    renderG();
}

function DrawTriangle(triangle,color,fill) {
    var points = [triangle.points[0].p, triangle.points[1].p, triangle.points[2].p, triangle.center, triangle.nm];

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(mat4()));

    gl.bindBuffer(gl.ARRAY_BUFFER, line);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(vPos);

    gl.uniform4fv(colorPosition, flatten(vec4(0, color, 0, 1)));
    if (fill) {
        gl.uniform1i(wireLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.drawArrays(gl.LINES, 2, 2);
    } else {
        gl.uniform1i(wireLoc, 1);
        gl.drawArrays(gl.LINE_LOOP, 0, 3);
        gl.drawArrays(gl.POINTS, 0, 3);
        gl.drawArrays(gl.LINES, 3, 2);
    }
}

function DrawPoint(points, color) {

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(mat4()));

    gl.bindBuffer(gl.ARRAY_BUFFER, line);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(vPos);

    gl.uniform4fv(colorPosition, flatten(color));

    gl.drawArrays(gl.POINTS, 0, 1);

}


function DrawSimplex(simpl) {
    var points = [simpl.a.p, simpl.b.p, simpl.c.p, simpl.d.p];
    gl.uniform1i(wireLoc, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(mat4()));

    gl.bindBuffer(gl.ARRAY_BUFFER, line);
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(vPos);

    gl.drawArrays(gl.LINE_LOOP, 0, 4);
}

function DrawModel(obj,m,color) {
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(m));

    gl.uniform1i(wireLoc, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.model.buffer);
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPos);

    gl.uniform4fv(colorPosition, flatten(color));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.model.indexes);
    gl.drawElements(gl.TRIANGLES, obj.model.numIndices, gl.UNSIGNED_SHORT, 0);
}

function DrawNormal(n,point,depth,color) {
    var angles = NormalToAngles(n);
    var rotX = rotate(degrees(angles.phy), vec3(1, 0, 0));
    var rotY = rotate(degrees(angles.theta), vec3(0, 1, 0));
    var sc = scalem(1, depth, 1);
    var tr = translate(point);
    var srx=mult(rotX,sc);
    var mrs = mult(rotY, srx);
    var mtt = mult(tr, mrs);
    DrawModel(vector, mtt,color);
}



function renderG() {
    if (mode==BY_STEPS)
        return;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var rotX = rotate(-degrees(phi), vec3(1, 0, 0));
    var rotY = rotate(-degrees(theta), vec3(0, 1, 0));
    var mrot=mult(rotX,rotY);
    var View = mult(translate(vec3(0, 0, -radius)), mrot);

    var projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(View));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    if (modelsList.length >= 2) {
        simplex.Restart();
        for (var i = 0; i < modelsList.length; ++i) {
            modelsList[i].instance.colliding=false;
        }

        for (var i = 0; i < modelsList.length; ++i) {
            for (var j = i+1; j < modelsList.length; ++j) {
                if (simplex.CollisionDetection(modelsList[i], modelsList[j])) {
                    modelsList[i].instance.colliding = true;
                    modelsList[j].instance.colliding = true;
                    epa.Restart(simplex);
                    if (epa.FindCollision(simplex)) {
                        DrawNormal(epa.colNormal, epa.colPointW,epa.depth, vec4(1.0, 0.0, 1.0, 1.0));
                    } else {
                        console.log(epa.step);
                    }
                    var triangles = epa.lst_triangles;
                    for (var z = 0; z < triangles.length; ++z) {
                        var curTrian = triangles[z];
                        DrawTriangle(curTrian, (z * 1.0) / (1.0 * triangles.length));
                    }
                }
            }
        }
    }

    for (var z = 0; z < modelsList.length; ++z) {
        var obj = modelsList[z];

        var Model = obj.instance.Mat;
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(Model));

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.model.buffer);
        gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(vPos);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.model.indexes);

        gl.uniform1i(wireLoc, 1);

        if (obj.instance.colliding==true) {
            gl.uniform4fv(colorPosition, flatten(vec4(1, 0, 0, 1)));
        } else if (selected==z) {
            gl.uniform4fv(colorPosition, flatten(vec4(0, 1, 1, 1)));
        } else {
            gl.uniform4fv(colorPosition, flatten(obj.instance.color));
        }

        gl.drawElements(gl.LINE_STRIP, obj.model.numIndices, gl.UNSIGNED_SHORT, 0);
        
    }

    if (mode == AUTOMATIC) {
        requestAnimFrame(renderG);
    } else {
        requestAnimationFrame(render)
    }
}


function render(c) {
    if (mode==AUTOMATIC)
        return;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var rotX = rotate(-degrees(phi), vec3(1, 0, 0));
    var rotY = rotate(-degrees(theta), vec3(0, 1, 0));
    var mrot = mult(rotX, rotY);
    var View = mult(translate(vec3(0, 0, -radius)), mrot);

    var projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(View));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));


    if (!c) {
        if (epa.FindCollision(simplex)) {
            mode = AUTOMATIC;
        } 
    }
                    var triangles = epa.lst_triangles;
                    for (var z = 0; z < triangles.length; ++z) {
                        var curTrian = triangles[z];
                        DrawTriangle(curTrian, (z * 1.0) / (1.0 * triangles.length));
                    }
                    triangles = epa.removed;
                    for (var z = 0; z < triangles.length; ++z) {
                        var curTrian = triangles[z];
                        DrawTriangle(curTrian, 1,true);
                    }

    for (var z = 0; z < modelsList.length; ++z) {
        var obj = modelsList[z];

        var Model = obj.instance.Mat;
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(Model));

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.model.buffer);
        gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(vPos);


        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.model.indexes);

        gl.uniform1i(wireLoc, 1);

        if (obj.instance.colliding == true) {
            gl.uniform4fv(colorPosition, flatten(vec4(1, 0, 0, 1)));
        } else if (selected == z) {
            gl.uniform4fv(colorPosition, flatten(vec4(0, 1, 1, 1)));
        } else {
            gl.uniform4fv(colorPosition, flatten(obj.instance.color));
        }

        gl.drawElements(gl.LINE_STRIP, obj.model.numIndices, gl.UNSIGNED_SHORT, 0);

    }
    
    if (mode == BY_STEPS) {
        window.setTimeout(render, 500);
    } else {
        requestAnimationFrame(renderG)
    }
}