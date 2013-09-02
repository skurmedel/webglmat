varying vec3 N;
varying vec3 p;
varying vec2 UV;
varying vec3 TN;
varying vec3 BTN;


attribute vec4 tangent;

void main() 
{ 
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
	p = (modelViewMatrix * vec4(position, 1.0)).xyz;
	N = normalMatrix * normal;
	TN = normalMatrix * tangent.xyz;
	BTN = cross(N, TN);
	UV = uv;
}