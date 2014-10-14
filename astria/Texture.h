#ifndef _TEXTURE_H_
#define _TEXTURE_H_

#include "Common.h"

enum ETextureFiltering
{
	TEXTURE_FILTER_MAG_NEAREST = 0, // Nearest criterion for magnification
	TEXTURE_FILTER_MAG_BILINEAR, // Bilinear criterion for magnification
	TEXTURE_FILTER_MIN_NEAREST, // Nearest criterion for minification
	TEXTURE_FILTER_MIN_BILINEAR, // Bilinear criterion for minification
	TEXTURE_FILTER_MIN_NEAREST_MIPMAP, // Nearest criterion for minification, but on closest mipmap
	TEXTURE_FILTER_MIN_BILINEAR_MIPMAP, // Bilinear criterion for minification, but on closest mipmap
	TEXTURE_FILTER_MIN_TRILINEAR, // Bilinear criterion for minification on two closest mipmaps, then averaged
};

class CTexture
{
public:
	CTexture();
	CTexture(std::string file, bool generateMipMap = false);

	bool load_2D(std::string file, bool generateMipMap = false);
	void createEmpty(int width, int height, GLenum format);
	void createFromData(BYTE* data, int width, int height, int BPP, GLenum format, bool generateMipMap = false);
	void release();

	bool reload();
	
	void setFiltering(int magnification, int minification);
	void setSamplerParameter(GLenum parament, GLenum value);

	int getMinificationFilter();
	int getMagnificationFilter();

	int getWidth();
	int getHeight();
	int getBPP();

	std::string getFile();

	void bind(int textureUnit = 0);

	GLuint getID();
	GLuint operator()();

private:
	bool load_SDL(std::string file);
	bool load_DDS(std::string file);

private:
	std::string file;
	GLuint texture;
	GLuint sampler;
	GLenum format;
	int width, height, BPP;
	bool mipmap;

	int minification;
	int magnification;
};

#endif