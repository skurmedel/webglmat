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
	vec3 refl = F * textureCube(env, R).xyz * 2.0;

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