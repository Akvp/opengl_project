#version 330

struct Material
{
	sampler2D diffuse;
	sampler2D normal;
	sampler2D specular;
};

struct DirectionalLight
{
	vec3 vColor;
	vec3 vDirection;
	float fAmbient;
	float fBrightness;
};

struct FogParameters
{
	vec4 vFogColor; // Fog color
	float fStart; // This is only for linear fog
	float fEnd; // This is only for linear fog
	float fDensity; // For exp and exp2 equation
	
	int iEquation; // 0 = linear, 1 = exp, 2 = exp2
};

uniform DirectionalLight sunLight;
uniform vec3 vEyePosition;
uniform Material mat;
uniform FogParameters fogParams;
uniform sampler2D sShadowMap;

//Boolean values
uniform int bSkybox;
uniform bool bFog;
uniform bool bEnableNormalMap;
uniform bool bEnableShadowMap;

smooth in vec2 vTexCoord;
smooth in vec3 vNormal;
smooth in vec4 vEyeSpacePos;
smooth in vec3 vWorldPos;
smooth in vec4 vShadowCoord;
in vec3 vLightDir_tangentspace;
in vec3 vEyeDir_tangentspace;

out vec4 outputColor;

//function prototypes
float getFogFactor(FogParameters params, float fFogCoord);
float GetVisibility(sampler2D shadowMap, vec4 vShadowCoord);

void main()
{
	if (bSkybox == 1)
	{
		vec3 vTexColor = sunLight.vColor * vec3(texture2D(mat.diffuse, vTexCoord));
		outputColor = vec4(vTexColor * sunLight.fBrightness, 1.0f);
		if(bFog)
		{
			float fFogCoord = 500 * 230 * 0.005;
			outputColor = mix(outputColor, fogParams.vFogColor, getFogFactor(fogParams, fFogCoord));
		}
		return;
	}

	vec3 vNormal_extended = normalize(vNormal);
	vec3 vLightDir = sunLight.vDirection;
	vec3 vEyeDirection = vEyePosition - vWorldPos;

	//Normal map adjustments
	if(bEnableNormalMap)
	{
		vNormal_extended = normalize(texture2D(mat.normal, vTexCoord).rgb*2.0-1.0);
		vLightDir = normalize(vLightDir_tangentspace);
		vEyeDirection = vEyeDir_tangentspace;
	}

	//Diffuse light
	float fDiffuseIntensity = clamp(dot(vNormal_extended, -vLightDir), 0.0, 1.0);
	vec3 vDiffuseColor = sunLight.fBrightness * sunLight.vColor * fDiffuseIntensity * vec3(texture2D(mat.diffuse, vTexCoord));
	
	//Ambient
	vec3 vAmbientColor = sunLight.vColor * sunLight.fAmbient * vec3(texture2D(mat.diffuse, vTexCoord));
	
	//Specular	
	vec3 vReflected = reflect(vLightDir, vNormal_extended);
	vec3 vView = normalize(vEyeDirection);
	float fSpecularIntensity = clamp(dot(vReflected, vView), 0, 1);
	vec3 vSpecularColor = sunLight.fBrightness * 0.6 * sunLight.vColor * fSpecularIntensity * vec3(texture2D(mat.specular, vTexCoord));

	outputColor = vec4(vAmbientColor + vDiffuseColor + vSpecularColor, 1.0f);
	
	//Shadow computations
	float visibility = GetVisibility(sShadowMap, vShadowCoord);
	outputColor *= visibility;

	if (bFog)
	{
		float fFogCoord = distance(vEyePosition, vWorldPos);
		outputColor = mix(outputColor, fogParams.vFogColor, getFogFactor(fogParams, fFogCoord));
	}
}

vec2 poissonDisk[16] = vec2[]( 
   vec2( -0.94201624, -0.39906216 ), 
   vec2( 0.94558609, -0.76890725 ), 
   vec2( -0.094184101, -0.92938870 ), 
   vec2( 0.34495938, 0.29387760 ), 
   vec2( -0.91588581, 0.45771432 ), 
   vec2( -0.81544232, -0.87912464 ), 
   vec2( -0.38277543, 0.27676845 ), 
   vec2( 0.97484398, 0.75648379 ), 
   vec2( 0.44323325, -0.97511554 ), 
   vec2( 0.53742981, -0.47373420 ), 
   vec2( -0.26496911, -0.41893023 ), 
   vec2( 0.79197514, 0.19090188 ), 
   vec2( -0.24188840, 0.99706507 ), 
   vec2( -0.81409955, 0.91437590 ), 
   vec2( 0.19984126, 0.78641367 ), 
   vec2( 0.14383161, -0.14100790 ) 
);

float GetVisibility(sampler2D shadowMap, vec4 vShadowCoord)
{
    if(!bEnableShadowMap)return 1.0;
    float visibility = 1.0;
    float bias = 0.005;
 
    vec4 shadowCoordinateWdivide = vec4(vShadowCoord.x/vShadowCoord.w, vShadowCoord.y/vShadowCoord.w, (vShadowCoord.z-bias)/vShadowCoord.w, 1.0) ;

    for (int i=0;i<4;i++)
    {
      int index = i;
		  vec4 vShadowSmooth = vec4(vShadowCoord.x + poissonDisk[index].x/700.0, vShadowCoord.y + poissonDisk[index].y/700.0, (vShadowCoord.z-bias)/vShadowCoord.w, 1.0);
		  float fSub = texture(shadowMap, vShadowSmooth.st).r; 
		  visibility -= 0.1*(1.0-fSub);
    }
    return visibility;
}

float getFogFactor(FogParameters params, float fFogCoord)
{
	float fResult = 0.0;
	if(params.iEquation == 0)
		fResult = (params.fEnd-fFogCoord)/(params.fEnd-params.fStart);
	else if(params.iEquation == 1)
		fResult = exp(-params.fDensity*fFogCoord);
	else if(params.iEquation == 2)
		fResult = exp(-pow(params.fDensity*fFogCoord, 2.0));
		
	fResult = 1.0-clamp(fResult, 0.0, 1.0);
	
	return fResult;
}
