varying vec3 N;
varying vec3 p;

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

float compute_spec(float Krn, float roughness, vec3 H, vec3 L, vec3 N, vec3 V)
{
	/*
		Cook-Torrance Microfacet model.

		D = microfacet slope distribution.
		G = geometric attenuation.
		F = fresnel coefficient.
	*/
	float NdotH = dot(N, H);
	float NdotV = dot(N, V);
	float VdotH = dot(V, H);
	float NdotL = dot(N, L);

	float gauss = 100.0;

	float G = min(
		1.0, 
		min(
			(2.0 * NdotH * NdotV) / VdotH, 
			(2.0 * NdotH * NdotL) / VdotH));
	float a = acos(NdotH);
	float D = gauss * exp(-(a * a) / (roughness * roughness));
	float F = schlick(Krn, VdotH);

	return ((F * D * G) / (3.1417 * NdotV)) / 3.1417;
}

vec3 compute_diffuse(vec3 Nn, vec3 L)
{
	return vec3(dot(Nn, L));
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
	
	float Krn = 0.1;
	float roughness = 0.2;

	vec3 diffuse = compute_diffuse(Nn, L) * vec3(0.4, 0.1, 1.0);
	vec3 spec    = compute_spec(Krn, roughness, H, L, Nn, V) * vec3(1.0);

	gl_FragColor = vec4(diffuse + spec, 1.0);
}