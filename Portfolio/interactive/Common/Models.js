var diffuse = 0x666666;
var specular = 0x666666;
var shininess = 10.0;

const LIGHT = 1;
const MODEL = 0;

const PLANE = 4;
const SPHERE = 1;
const CONE = 2;
const CYLINDER = 3;
const OBJ = 4;

function Instance() {
    this.Mat = mat4();
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.update = false;
    this.model = null;

    //as model
    this.diffuse = color2fvec(diffuse);
    this.specular = color2fvec(specular);
    this.shininess = shininess;

    //as light
    this.type = MODEL;
    this.distance = null;

    this.Update = function () {
        var rotX = rotate(this.rotation[0], vec3(1, 0, 0));
        var rotY = rotate(this.rotation[1], vec3(0, 1, 0));
        var rotZ = rotate(this.rotation[2], vec3(0, 0, 1));
        var mrot = mult(rotZ, mult(rotY, rotX));
        this.Mat = mult(translate(this.position), mult(mrot, scalem(this.scale)));
        this.update = false;
    }
}

function Model() {
    this.buffer = 0;
    this.indexes = 0;
    this.type = 0;
    this.numIndices = 0;
}

var spheres = [];

function Sphere(rings, sectors,radius) {
    var hash = rings << 8 | sectors;

    if (spheres[hash]) {
        this.model = spheres[hash];
    } else {
        //create the model and save it on the hashtable
        this.model = new Model();
        this.model.type = SPHERE;

        var PI = 3.1415926535897;
        var PI_2 = 3.1415926535897 / 2;

        var indices = new Array(rings * sectors * 6);

        var data = new Array(rings * sectors * 8);


        var R = 1.0 / (rings - 1);
        var S = 1.0 / (sectors - 1);
        var r, s;

        var index = -1;

        for (r = 0; r < rings; r++) for (s = 0; s < sectors; s++) {
            var y = (Math.sin(-PI_2 + PI * r * R));
            var x = (Math.cos(2 * PI * s * S) * Math.sin(PI * r * R));
            var z = (Math.sin(2 * PI * s * S) * Math.sin(PI * r * R));

            //vertices
            data[++index] = x * radius;
            data[++index] = y * radius;
            data[++index] = z * radius;

            //normal
            data[++index] = x;
            data[++index] = y;
            data[++index] = z;

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

        if (radius == 0.5)    //add to hash only if the radius is the standard
        spheres[hash] = this.model;
    }

    this.instance = new Instance();

    this.instance.position = position;
    this.instance.rotation = rotation;
    this.instance.scale = scale;
    this.instance.Update();
}


var cones = [];     //hash table for cones

function Cone(sectors,radius) {
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
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            //vertices
            data[++index] = 0;
            data[++index] = 0.5;
            data[++index] = 0;

            //normal
            data[++index] = x / 1.4112;
            data[++index] = 1 / 1.4112;
            data[++index] = z / 1.4112;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        r = 1;
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            //vertices
            data[++index] = x * radius;
            data[++index] = -0.5;
            data[++index] = z * radius;

            //normal
            data[++index] = x;
            data[++index] = 0;
            data[++index] = z;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        r = 3;
        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            //vertices
            data[++index] =0;
            data[++index] = -0.5;
            data[++index] = 0;

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

        if (radius==0.5)    //add to hash only if the radius is the standard
        cones[hash] = this.model;
    }

    this.instance = new Instance();

    this.instance.position = position;
    this.instance.rotation = rotation;
    this.instance.scale = scale;
    this.instance.Update();
}

var cylinders = [];     //hash table for cones

function Cylinder(sectors,radius,ringsMiddle = 2) {
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

		var rings = clamp( ringsMiddle +2, 4 , 24);
		
        var data = new Array(rings * sectors * 8);

        var R = 1.0 / (rings - 1);
        var S = 1.0 / (sectors - 1);
        var r, s;

        var index = -1;
        r = 0;

        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            //vertices
            data[++index] = 0;
            data[++index] = 0.5;
            data[++index] = 0;

            //normal
            data[++index] = 0;
            data[++index] = 1;
            data[++index] = 0;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }
		
		var middleAreas = rings - 2; 
		var advanceMiddle = 1.0 / middleAreas;
		

		for (r = 0; r <= middleAreas; ++r){
			var y = 0.5 - (r * advanceMiddle);

			for (s = 0; s < sectors; s++) {
				var x = Math.cos(2 * PI * s * S);
				var z = Math.sin(2 * PI * s * S);

				//vertices
				data[++index] = x * radius;
				data[++index] = y;
				data[++index] = z * radius;

				//normal
				data[++index] = x;
				data[++index] = 0;
				data[++index] = z;

				//texture coordinates			
				data[++index] = s * S;
				data[++index] = r * R * advanceMiddle * r;
			}
		}


        r = 3;

        for (s = 0; s < sectors; s++) {
            var x = Math.cos(2 * PI * s * S);
            var z = Math.sin(2 * PI * s * S);

            //vertices
            data[++index] = 0;
            data[++index] = -0.5;
            data[++index] = 0;

            //normal
            data[++index] = 0;
            data[++index] = -1;
            data[++index] = 0;

            //texture coordinates			
            data[++index] = s * S;
            data[++index] = r * R;
        }

        index = -1;
        for (r = 0; r < rings ; r++){
			for (s = 0; s < sectors - 1; s++) {
				indices[++index] = r * sectors + s;
				indices[++index] = r * sectors + (s + 1);
				indices[++index] = (r + 1) * sectors + (s + 1);
				indices[++index] = (r + 1) * sectors + (s + 1);
				indices[++index] = (r + 1) * sectors + s;
				indices[++index] = r * sectors + s;
			}
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

        if (radius == 0.5)    //add to hash only if the radius is the standard
        cylinders[hash] = this.model;
    }

    this.instance = new Instance();

    this.instance.position = position;
    this.instance.rotation = rotation;
    this.instance.scale = scale;
    this.instance.Update();
}

function CreateByType(rings, sectors,radius,type) {
    switch (type) {
        case SPHERE:
            sel = new Sphere(rings, sectors, radius);
            break;
        case CONE:
            sel = new Cone(sectors, radius);
            break;
        case CYLINDER:
            sel = new Cylinder(sectors, radius);
            break;
        default:
            throw "invalid option";
            break;
    }
    return sel;
}


function Plane() {
        //create the model and save it on the hashtable
        this.model = new Model();
        this.model.type = PLANE;

        var indices = [0,1,2,   0,2,3];

        var data = [
            0.5, 0.5,0.0,    0.0,0.0,-1.0,   1.0,1.0,
           -0.5, 0.5,0.0,    0.0,0.0,-1.0,   0.0,1.0,
           -0.5,-0.5,0.0,    0.0,0.0,-1.0,   0.0,0.0,
            0.5,-0.5,0.0,    0.0,0.0,-1.0,   1.0,0.0
        ];

        //data buffer
        this.model.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.model.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

        //index buffer

        this.model.indexes = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexes);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indices), gl.STATIC_DRAW);

        this.model.numIndices = indices.length;

    this.instance = new Instance();

    this.instance.position = position;
    this.instance.rotation = rotation;
    this.instance.scale = scale;
    this.instance.Update();
}