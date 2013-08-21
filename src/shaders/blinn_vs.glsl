varying vec3 N;
varying vec3 p;

void main() 
{ 
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
	p = gl_Position.xyz; N = normalize((normalMatrix * normal)).xyz;
}