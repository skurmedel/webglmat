varying vec3 N;
varying vec3 p;

uniform samplerCube env;
uniform float roughness;
uniform float ior;
uniform vec3 light_pos;

/*
	Injected by Three.js
	uniform mat4 viewMatrix;
	uniform vec3 cameraPosition;
*/

/*
	Contains common vectors for different stuff,
	unclutters the code quite a bit.
*/
struct directions
{
	vec3 H;
	vec3 L;
	vec3 N;
	vec3 V;
};

float schlick(float F0, float HdotV)
{
	return F0 + (1.0 - F0) * pow((1.0 - HdotV), 5.0);
}

float schlick_ior(float ior1, float ior2, float HdotV)
{
	float F0 = (ior1 - ior2) / (ior1 + ior2);
	return schlick(F0 * F0, HdotV);
}

float d_gtr2(float roughness, float NdotH)
{
	float a2 = roughness * roughness;
	float term1 = 3.1417;
	float term2 = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
	float deno = term1 * (term2 * term2);
	return a2 / deno;
}

vec3 d_gtr2_sample(float roughness, vec3 x, vec3 y, vec3 n, vec3 v, float r)
{
	float ax = roughness;
	float ay = ax;

	/*
		Make up some kind of rx and ry.
	*/
	float rx = (r + n.x + n.y) / 3.0;
	float ry = (1.0 - r + n.z + n.x + rx) / (3.0 + rx);

	float term1 = sqrt(ry / (1.0 - ry));
	vec3  term2 = (ax * cos(2.0 * 3.1415 * rx) * x) + (ay * sin(2.0 * 3.1415 * rx) * y);

	vec3 h = normalize(term1 * term2 + n);

	vec3 L = (2.0 * dot(v, h) * h) - v;


	return textureCube(env, normalize(L), roughness * 2.0).xyz;
}

vec3 compute_specular(float ior, float roughness, directions dir, float F)
{
	/*
		Cook-Torrance Microfacet model.

		D = microfacet slope distribution.
		G = geometric attenuation.
		F = fresnel coefficient.
	*/
	float NdotH = max(0.0, dot(dir.N, dir.H));
	float NdotV = max(0.0, dot(dir.N, dir.V));
	float VdotH = max(0.0, dot(dir.V, dir.H));
	float NdotL = max(0.0, dot(dir.N, dir.L));

	vec3 R = normalize(p + reflect(dir.L, dir.N));

	/*
		Sample environment.
	*/
	vec3 x = dir.N.xzy;
	vec3 y = dir.N.yxz;
	vec3 refl = d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.1) 
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.9) 
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.5)
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.3)
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.6)
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.23)
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.77)
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.02)
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.14)
	          + d_gtr2_sample(roughness, x, y, dir.N, dir.V, 0.7);
	     refl = (refl * 0.1) * F * 2.0;

	float G = min(
		1.0, 
		min(
			(2.0 * NdotH * NdotV) / VdotH, 
			(2.0 * NdotH * NdotL) / VdotH));
	float a = acos(NdotH);
	float D = d_gtr2(roughness, NdotH);

	return ((F * D * G) / (4.0 * NdotL * NdotV)) + refl;
}

/*
	Computes the diffuse term.

	All vectors must be unit vectors.

	Nn 	surface normal.
	L 	incident light vector.
	F 	fresnel coefficient.
*/
vec3 compute_diffuse(directions dir, float F)
{
	return (1.0 - F) * vec3(dot(dir.N, dir.L));
}

void main() 
{
	directions dir;

	dir.V = normalize(viewMatrix * vec4(cameraPosition - p, 1.0)).xyz;
	vec3 Lp = (viewMatrix * vec4(light_pos, 1.0)).xyz;
	dir.L = normalize(p - Lp);
	dir.H = normalize(dir.L + dir.V);
	// The normalized-normal, interpolated normals
	// might not be unit vectors.
	dir.N = normalize(N);
	
	float F = schlick_ior(1.0, ior, dot((dir.L + -dir.V), -dir.V));

	vec3 diffuse = compute_diffuse(dir, F) * vec3(1.0, 1.0, 1.0);
	vec3 spec    = compute_specular(ior, roughness, dir, F) * vec3(1.0);

	gl_FragColor = vec4(diffuse + spec, 1.0);
}