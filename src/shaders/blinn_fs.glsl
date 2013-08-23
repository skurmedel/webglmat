varying vec3 N;
varying vec3 p;

uniform vec3 light_pos;

/*
	Injected by Three.js
	uniform mat4 viewMatrix;
	uniform vec3 cameraPosition;
*/

void main() 
{
	vec3 V = normalize(viewMatrix * vec4(cameraPosition, 1.0)).xyz;
	vec3 Lp = (viewMatrix * vec4(light_pos, 1.0)).xyz;
	vec3 L = normalize(p - Lp);
	vec3 H = normalize(L + V);
	// The normalized-normal, interpolated normals
	// might not be unit vectors.
	vec3 Nn = normalize(N);
	
	vec3 diffuse = dot(Nn, L) * vec3(0.4, 0.1, 1.0);
	vec3 spec = pow(max(0.0, dot(H, Nn)), 50.0) * vec3(0.6);
		 spec+= pow(max(0.0, dot(H, Nn)), 20.0) * vec3(0.3);
		 spec+= pow(max(0.0, dot(H, Nn)),  2.0) * vec3(0.1);
	gl_FragColor = vec4(diffuse + spec, 1.0);
}