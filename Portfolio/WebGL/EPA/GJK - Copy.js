"use strict";

function supportPoint(a,b,c,i) {
    this.p = vec3(a, b, c);
    this.index = i;
}

function ToWorld(shape,vect){
    return mult(shape.instance.Mat, vec4(vect[0], vect[1], vect[2], 1));
}

function getFarthestPointInDirection(shape, dir) {
    var vertices = shape.model.vertices;
    var inverseM = inverse(shape.instance.Mat);
    var v4 = mult(inverseM, vec4(dir, 0));
    var localDir = vec3(v4);

    var returnVector = vertices[0];
    var maxDot = dot3(returnVector, localDir);
    var index=0;

    for (var z = 1; z < vertices.length ; ++z) {
        var vertex = vertices[z];
        var dt = dot3(vertex, localDir);
        if (dt > maxDot) {
            maxDot = dt;
            returnVector =vertex;
            index=z;
        }
    }
    var ret = ToWorld(shape, returnVector);
   // ret[3] = index; //index of vertex in shape. It goes in w for EPA
  //  console.log(dir, v4,inverseM,localDir, vertices.length, returnVector, vec4(returnVector, 1), shape.instance.Mat, ret);
 //   throw new Error('This is not an error. This is just to abort javascript');
    return new supportPoint(ret[0], ret[1], ret[2],index);
}

function doubleCross(a,b){
    return cross(cross(a,b),a);
}

function support(shape1,shape2, dir)
{
    var p1 = getFarthestPointInDirection(shape1,dir);
    var p2 = getFarthestPointInDirection(shape2,negate(dir));
  //  console.log(p1,p2);
    return subtract(p1.p , p2.p);
}

function Simplex() {

    this.a=vec3(0);
    this.b=vec3(0);
    this.c=vec3(0); 
    this.d=vec3(0);
    this.nrPointsSimplex = 0;
    this.dir = vec3(1);
    this.steps = 0;
    this.shape1=null;
    this.shape2 = null;
    this.Restart = function () {
        this.a = vec3(0);
        this.b = vec3(0);
        this.c = vec3(0);
        this.d = vec3(0);
        this.nrPointsSimplex = 0;
        this.dir = vec3(1);
        this.steps = 0;
        this.shape1 = null;
        this.shape2 = null;
}

    this.CollisionDetection=function (shape1,shape2)
    {
        this.shape1 = shape1;
        this.shape2 = shape2;

        this.dir = vec3(1,1,1)//subtract(shape1.instance.position, shape2.instance.position);        //direction of centers
		
        this.c = support(shape1, shape2, this.dir);
        
        this.dir = negate(this.c);//negative direction

        this.b = support(shape1, shape2, this.dir);

        if (dot3(this.b, this.dir) < 0)
        {
            return false;
        }
        this.dir = doubleCross(subtract(this.c, this.b), negate(this.b));
	 
        this.nrPointsSimplex = 2; //begin with 2 points in simplex
	
        this.steps = 0;//avoid infinite loop
        while (this.steps < 20)
        {
            
            this.a = support(shape1, shape2, this.dir);

            if (dot3(this.a, this.dir) < 0)
            {
                return false;
            }
            else
            {
			 
                if (this.ContainsOrigin())
                {
                    return true;
                }
            }
            this.steps++;
          //  console.log(this.a,this.b,this.c,this.d);
        }
	
        return false;
    }

    this.ContainsOrigin= function( )
    {
        /*if (n == 1)
        {
           return line(a, dir);     //not requiered
        }*/
	 
        if (this.nrPointsSimplex == 2)
        {
            return this.triangle(this.dir);
        }
        else if (this.nrPointsSimplex == 3)
        {
            return this.tetrahedron(this.dir);
        }
	
        return false;
    }

    /*this.line(vector3& dir)
    {
        vector3 ab = b - a;
        vector3 ao = -a;//vector3::zero() - a

        //can t be behind b;

        //new direction towards a0
        dir = vector3::doubleCross(ab, ao);

        c = b;
        b = a;
        nrPointsSimplex = 2;

        return false;
    }*/

    this.triangle= function()
    {
        var ao = vec3(-this.a[0], -this.a[1], -this.a[2]);
        var ab = subtract(this.b , this.a);
        var ac = subtract(this.c , this.a);
        var abc = cross(ab, ac);

        //point is can't be behind/in the direction of B,C or BC

	
        var ab_abc = cross(ab, abc);
        // is the origin away from ab edge? in the same plane
        //if a0 is in that direction than
        if (dot3(ab_abc,ao) > 0)
        {
            //change points
            this.c = this.b;
            this.b = this.a;

            //dir is not ab_abc because it's not point towards the origin
            this.dir = doubleCross(ab, ao);

            //direction change; can't build tetrahedron
            return false;
        }

	
        var abc_ac = cross(abc, ac); 

        // is the origin away from ac edge? or it is in abc?
        //if a0 is in that direction than
        if (dot3(abc_ac,ao) > 0)
        {
            //keep c the same
            this.b = this.a;

            //dir is not abc_ac because it's not point towards the origin
            this.dir = doubleCross(ac, ao);
				
            //direction change; can't build tetrahedron
            return false;
        }

        //now can build tetrahedron; check if it's above or below
        if (dot3(abc,ao) > 0)
        {
            //base of tetrahedron
            this.d = this.c;
            this.c = this.b;
            this.b = this.a;

            //new direction
            this.dir = abc;
        }
        else
        {
            //upside down tetrahedron
            this.d = this.b;
            this.b = this.a;
            this.dir = negate(abc);
        }

        this.nrPointsSimplex = 3;
	
        return false;
    }

    this.tetrahedron=function()
    {
        var ao = negate(this.a);//0-a
        var ab = subtract(this.b , this.a);
        var ac = subtract(this.c , this.a);
	 
        //build abc triangle
        var abc = cross(ab, ac);

        //CASE 1
        if (dot3(abc,ao) > 0)
        {
            //in front of triangle ABC
            //we don't have to change the ao,ab,ac,abc meanings
            return this.checkTetrahedron(ao, ab, ac, abc);
        }
	 

        //CASE 2:
	 
        var ad = subtract(this.d , this.a);

        //build acd triangle
        var acd = cross(ac, ad);

        //same direaction with ao
        if (dot3(acd,ao) > 0)
        {

            //in front of triangle ACD
            this.b = this.c;
            this.c = this.d;
            ab = ac;
            ac = ad;
            abc = acd;

            return this.checkTetrahedron(ao, ab, ac, abc);
        }

        //build adb triangle
        var adb = cross(ad, ab);

        //same direaction with ao
        if (dot3(adb,ao) > 0)
        {

            //in front of triangle ADB

            this.c = this.b;
            this.b = this.d;

            ac = ab;
            ab = ad;

            abc = adb;
            return this.checkTetrahedron(ao, ab, ac, abc);
        }


        //origin in tetrahedron
        return true;

    }

    this.checkTetrahedron=function(ao,ab,ac,abc)
    {
	 
        //almost the same like triangle checks
        var ab_abc = cross(ab, abc);

        if (dot3(ab_abc,ao) > 0)
        {
            this.c = this.b;
            this.b = this.a;

            //dir is not ab_abc because it's not point towards the origin;
            //ABxA0xAB direction we are looking for
            this.dir = doubleCross(ab, ao);
		 
            //build new triangle
            // d will be lost
            this.nrPointsSimplex = 2;

            return false;
        }

        var acp = cross(abc, ac);

        if (dot3(acp,ao) > 0)
        {
            this.b = this.a;

            //dir is not abc_ac because it's not point towards the origin;
            //ACxA0xAC direction we are looking for
            this.dir = doubleCross(ac, ao);
		 
            //build new triangle
            // d will be lost
            this.nrPointsSimplex = 2;

            return false;
        }

        //build new tetrahedron with new base
        this.d = this.c;
        this.c = this.b;
        this.b = this.a;

        this.dir = abc;

        this.nrPointsSimplex = 3;

        return false;
    }

}
