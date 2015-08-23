/////////////////////////////////////////////////////////////////////////
// Vertex shader for the final pass
//
// Copyright 2013 DigiPen Institute of Technology
////////////////////////////////////////////////////////////////////////
#version 330

void PhongVS();

uniform mat4 ModelMatrix;
uniform mat4 ViewMatrix, ViewInverse;
uniform mat4 ProjectionMatrix;
uniform mat4 NormalMatrix;

uniform vec3 lightPos;

in vec4 vertex;
in vec3 vertexNormal;
in vec2 vertexTexture;
in vec3 vertexTangent;

out vec3 tangent;
out vec2 texCoord;

out vec3 normalVec, lightVec, eyeVec;

void main()
{      
    tangent = vertexTangent;
    texCoord = vertexTexture;

    normalVec = normalize(mat3(NormalMatrix)*vertexNormal);    
    
    vec3 worldVertex = vec3(ModelMatrix * vertex);
    eyeVec = (ViewInverse*vec4(0,0,0,1)).xyz - worldVertex;
    lightVec = lightPos - worldVertex;

    gl_Position = ProjectionMatrix*ViewMatrix*ModelMatrix*vertex;
}
