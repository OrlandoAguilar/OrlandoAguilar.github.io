"use strict";


const _EXIT_THRESHOLD = 0.0001;
const _EXIT_ITERATION_LIMIT = 50;
const FLT_MAX=9999999999.0;


function barycentric(p,a,b,c) {
    // code from Crister Erickson's Real-Time Collision Detection
    var v0 = subtract(b , a);
    var v1 = subtract(c , a);
    var v2 = subtract(p , a);
    var d00 = dot3(v0,v0);
    var d01 = dot3(v0,v1);
    var d11 = dot3(v1,v1);
    var d20 = dot3(v2,v0);
    var d21 = dot3(v2,v1);
    var denom = d00 * d11 - d01 * d01;
    var _v=(d11 * d20 - d01 * d21) / denom;
    var _w=(d00 * d21 - d01 * d20) / denom;
    var _u=1.0 - _v - _w;
    return { u:_u, v : _v, w : _w };
}

function CanBeSeen(triangle,suportPoint){
    return dot(triangle.n, vec3(subtract(suportPoint, triangle.points[0].p))) > 0;
}

//support point is a vec4, where the w component is the index of the vertex in the original shape1

function Triangle(a,b,c) {
    this.points=[3];        //vec4 with w as the index of vertex in shape
    this.n = null;
    this.center = null;
    this.nm;
    this.Set= function(a,b,c) {    //vec4 (support point)
        this.points[0] = a;
        this.points[1] = b;
        this.points[2] = c;
        this.n = normalize(cross(subtract(b.p, a.p), subtract(c.p, a.p)));
        this.center = multf(0.3, add(add(this.points[0].p, this.points[1].p), this.points[2].p));
        this.nm = add(multf(0.4, this.n), this.center);
    }

    this.Set(a,b,c);
};

function Edge(a,b) {
    this.points=[2];

    this.Set=function(a,b) {
        this.points[0] = a;
        this.points[1] = b;
    }

    this.Set(a,b);
};

function VecEqual(a,b){
    if ( a.length != b.length ) {
        return false;
    }
    for (var z=0;z<a.length;++z){
        if (a[z]!=b[z])
            return false;
    }
    return true;
}

function EPA() {

    //arrays to keep the polytype
    this.lst_triangles = [];
    this.lst_edges = [];
    this.step = 0;
    this.colPointL = null;
    this.colNormal = null;
    this.depth = null;
    this.simplex = null;
    this.colPointW = null;
    this.removed = [];

    this.Restart=function(sim){
        this.lst_triangles = [];
        this.lst_edges = [];
        this.step = 0;
        this.colPointL = null;
        this.colPointW = null;
        this.colNormal = null;
        this.depth = null;
        this.simplex = sim;
        this.start(sim);
    }
    // process the specified edge, if another edge with the same points in the
    // opposite order exists then it is removed and the new point is also not added
    // this ensures only the outermost ring edges of a cluster of traingles remain
    // in the list
    this.AddEdge = function (a, b) {
        for (var z = this.lst_edges.length-1; z >=0 ; --z) {
            if (VecEqual(this.lst_edges[z].points[0].p, b.p) && VecEqual(this.lst_edges[z].points[1].p, a.p)) {  //interchanged 
                //opposite edge found, remove it and do not add new one
                this.lst_edges.splice(z, 1);
                return;
            }
        }
        this.lst_edges.push(new Edge(a, b));
    }

    this.AddNewTriangle = function (a, b, c) {
        this.lst_triangles.push(new Triangle(a, b, c));
    }

    this.start = function (sim) {
        // add the GJK simplex triangles to the list
        this.AddNewTriangle(sim.a, sim.b, sim.c);
        this.AddNewTriangle(sim.a, sim.c, sim.d);
         this.AddNewTriangle(sim.a, sim.d, sim.b);
         this.AddNewTriangle(sim.b, sim.d, sim.c);
       //  console.log('sim', sim.a, sim.b, sim.c, sim.d, sim.nrPointsSimplex);
        this.step = 0;
        this.simplex = sim;
    }

    this.FindCollision = function (sim) {
       
        while (++this.step < _EXIT_ITERATION_LIMIT) {

            // find closest triangle to origin
            var entry_cur_triangle_it = 0;
            var entry_cur_dst = FLT_MAX;
            for (var z = 0; z < this.lst_triangles.length; ++z) {
                var dst = Math.abs(dot(this.lst_triangles[z].n, this.lst_triangles[z].points[0].p));
                if (dst < entry_cur_dst) {
                    entry_cur_dst = dst;
                    entry_cur_triangle_it = z;
                }
            }

            var curTrian = this.lst_triangles[entry_cur_triangle_it];

            var entry_cur_support = support(sim.shape1,sim.shape2,curTrian.n);    //gets new support point

            var dist = dot(entry_cur_support.p, curTrian.n) - entry_cur_dst;
           // console.log('distances',dot(curTrian.n, entry_cur_support), entry_cur_dst);
           // console.log('curtrian e info', curTrian, dist, '  index=', entry_cur_triangle_it, this.lst_triangles.length, entry_cur_support);

            //if the support point does not change much the polytype, finish
            if (dist < _EXIT_THRESHOLD) {
                // calculate the barycentric coordinates of the closest triangle with respect to
                // the projection of the origin onto the triangle

                var bary = barycentric(multf(entry_cur_dst,curTrian.n),
                            curTrian.points[0].p,
                            curTrian.points[1].p,
                            curTrian.points[2].p);


                
                //world vertices
                var vect0 = ToWorld(sim.shape1, curTrian.points[0].shapePoint);
                var vect1 = ToWorld(sim.shape1, curTrian.points[1].shapePoint);
                var vect2 = ToWorld(sim.shape1, curTrian.points[2].shapePoint);

                //collision point in world coordinates
                this.colPointW = vec3(add(add(multf(bary.u, vect0),
                                     multf(bary.v, vect1)),
                                     multf(bary.w, vect2)));
                this.colPointL = vec3(add(add(multf(bary.u, curTrian.points[0].shapePoint),
                                     multf(bary.v, curTrian.points[1].shapePoint)),
                                     multf(bary.w, curTrian.points[2].shapePoint)));

                // collision normal
                this.colNormal = curTrian.n;

                // penetration depth
                this.depth = entry_cur_dst;

               // console.log('res', this.colPointL, this.colPointW, this.depth); throw "e";

                return true;
            }

            DrawPoint(entry_cur_support.p, vec4(0, 0, 1, 1));
            this.removed = [];

            //if didnt finish, create a new set of faces with the new support point
            for (var z = this.lst_triangles.length-1; z>=0 ; --z) {
                // can this face be 'seen' by entry_cur_support?
                var triangle = this.lst_triangles[z];
                var see = CanBeSeen(triangle, entry_cur_support.p);
                if (see) {
                    this.removed.push(triangle);
                   // DrawTriangle(triangle,1,true);
                    this.AddEdge(triangle.points[0], triangle.points[1]);
                    this.AddEdge(triangle.points[1], triangle.points[2]);
                    this.AddEdge(triangle.points[2], triangle.points[0]);
                    this.lst_triangles.splice(z, 1);
                }
            }

            // create new triangles from the edges in the edge list
            for (var z = 0; z < this.lst_edges.length; ++z) {
                var edge = this.lst_edges[z];
                this.AddNewTriangle(entry_cur_support, edge.points[0], edge.points[1]);
            }

            this.lst_edges = [];
            
            if (mode == BY_STEPS)
                return false;
        }//end while

        return false;
    }
}



