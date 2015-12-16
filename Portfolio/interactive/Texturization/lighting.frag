/////////////////////////////////////////////////////////////////////////
// Pixel shader for the final pass
//
// Copyright 2013 DigiPen Institute of Technology
////////////////////////////////////////////////////////////////////////
#version 330
#define M_PI 3.1415926535897932384626433832795
uniform int mode;
uniform bool useTexture;

uniform vec3 phongDiffuse;
uniform vec3 phongSpecular;
uniform float phongShininess;

uniform vec3 lightValue, lightAmbient;

uniform float gloss;
uniform float time;

uniform sampler2D earth;
uniform sampler2D atmosphere;

in vec3 normalVec, lightVec, eyeVec;
in vec2 texCoord;


vec3 Fressnel(vec3 Ks, vec3 L, vec3 H);
float D(vec3 N, vec3 H, float a);
//float G(vec3 L, vec3 H);
float G(vec3 L, vec3 H,vec3 N, vec3 V);
void main()
{
    vec3 N = normalize(normalVec);
    vec3 E = normalize(eyeVec);   
    vec3 L = normalize(lightVec);

	vec3 Ks=phongSpecular;
	vec3 H=normalize(L+E);

	float a=pow(phongShininess,gloss);
	
    vec3 Kd = phongDiffuse*texture(earth,texCoord.st).rgb;
	
	float clouds = texture2D(atmosphere,vec2(texCoord.s+time,texCoord.t)).b;
	float night =  texture2D(atmosphere,texCoord.st).g;
	float ocean =  texture2D(atmosphere,texCoord.st).r;
	
	float lightQuantity=dot(N,L);
	
	vec3 spec=vec3(0);
	
	if (ocean>0.0){
		vec3 fressnel=Fressnel(Ks,L,H);
		float d=D(N,H,a);
		float g=G(L,H,N,E);
		spec=fressnel*g*d*ocean/4.0; //I am using the approximation of G, therefore I am not dividing by the other dot products
	}
	
	vec3 illumination=lightAmbient*Kd+max(lightQuantity,0.0)*lightValue*( Kd/M_PI + spec)+vec3(clouds)*0.7;  
	
	vec3 color=illumination;
    color=mix(vec3(night),illumination,clamp((lightQuantity+0.2)*1.5,0.0,1.0));
	
    gl_FragColor.rgb = color;


}

vec3 Fressnel(vec3 Ks, vec3 L, vec3 H){
return Ks + (1.0-Ks)*pow(1-dot(L,H),5);
}

float D(vec3 N, vec3 H, float a){
return (a+2.0)*pow(max(dot(N,H),0.0),a)/(2.0*M_PI);
}

float G(vec3 L, vec3 H,vec3 N, vec3 V){
return 1.0/pow(max(dot(L,H),0.0),2.0);
}

/*return max(
min(  min(1.0 , 2.0*dot(N,H)*dot(N,V)/dot(H,V)),  2*dot(N,H)*dot(N,L)/dot(H,L))
,0.0);*/