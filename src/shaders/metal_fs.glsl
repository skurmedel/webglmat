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

float schlick(float F0, float HdotV)
{
	return F0 + (1.0 - F0) * pow((1.0 - HdotV), 5.0);
}

float schlick_ior(float ior1, float ior2, float HdotV)
{
	float F0 = (ior1 - ior2) / (ior1 + ior2);
	return schlick(F0 * F0, HdotV);
}

float TrowbridgeReitz(float a, float NdotH)
{
		float a2 = a * a;
		float pi = 3.1417;
		float denominator2 = ((NdotH * NdotH) * (a2 - 1.0) + 1.0);
		float denominator  = pi * (denominator2 * denominator2);
		
		return a2 / denominator;
}

float DGGXTrowbridgeReitz(float roughness, float NdotH)
{
	float a2 = roughness * roughness;
	float deno = 3.1417 * pow((NdotH * NdotH) * (a2 - 1.0) + 1.0, 2.0);
	return a2 / deno;
}

float compute_spec(float ior, float roughness, vec3 H, vec3 L, vec3 N, vec3 V, float F)
{
	/*
		Cook-Torrance Microfacet model.

		D = microfacet slope distribution.
		G = geometric attenuation.
		F = fresnel coefficient.
	*/
	float NdotH = max(0.0, dot(N, H));
	float NdotV = max(0.0, dot(N, V));
	float VdotH = max(0.0, dot(V, H));
	float NdotL = max(0.0, dot(N, L));

	float gauss = 9.0;

	float G = min(
		1.0, 
		min(
			(2.0 * NdotH * NdotV) / VdotH, 
			(2.0 * NdotH * NdotL) / VdotH));
	float a = acos(NdotH);
	float D = gauss * exp(-(a * a) / (roughness * roughness));
	// D = DGGXTrowbridgeReitz(roughness, NdotH);

	return (F * D * G) / (4.0 * NdotL * NdotV);
}

/*
	Computes the diffuse term.

	All vectors must be unit vectors.

	Nn 	surface normal.
	L 	incident light vector.
	F 	fresnel coefficient.
*/
vec3 compute_diffuse(vec3 Nn, vec3 L, float F)
{
	return (1.0 - F) * vec3(dot(Nn, L));
}

void main() 
{
	vec3 V = normalize(viewMatrix * vec4(cameraPosition - p, 1.0)).xyz;
	vec3 Lp = (viewMatrix * vec4(light_pos, 1.0)).xyz;
	vec3 L = normalize(p - Lp);
	vec3 H = normalize(L + V);
	// The normalized-normal, interpolated normals
	// might not be unit vectors.
	vec3 Nn = normalize(N);

	vec3 R = reflect(L, Nn);
	
	float F = schlick_ior(1.0, ior, dot((L + -V), -V));

	vec3 refl = F * textureCube(env, R).xyz * 2.0;

	vec3 diffuse = compute_diffuse(Nn, L, F) * vec3(1.0, 1.0, 1.0);
	vec3 spec    = compute_spec(ior, roughness, H, L, Nn, V, F) * vec3(1.0);

	gl_FragColor = vec4(diffuse + spec + refl, 1.0);
}