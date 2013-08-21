varying vec3 N;
varying vec3 p;
uniform vec3 light_pos;

void main() 
{
	vec3 Lp = (viewMatrix * vec4(light_pos, 1.0)).xyz;
	vec3 L = normalize(p - Lp);
	
  	gl_FragColor = vec4(dot(N, L) * vec3(0.4, 0.1, 1.0), 1.0);
}