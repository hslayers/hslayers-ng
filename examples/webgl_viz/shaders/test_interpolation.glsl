		
	attribute vec4 v_texCoord;
		
//	uniform sampler2D inter_raster;
	
	varying vec4 var_texCoord;

	void main() {
		
		gl_Position = v_texCoord;
		var_texCoord =  v_texCoord;

	}
