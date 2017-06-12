<script id="max_calculator_vShader" type="x-shader/x-vertex">
		
	attribute vec4 v_texCoord;
		
	//uniform sampler2D inter_raster;	
	varying vec4 var_texCoord;

	void main() {
		
		gl_Position = v_texCoord;
		var_texCoord =  v_texCoord;

	}
</script>
    
<script id="max_calculator_fShader" type="x-shader/x-fragment">
      precision mediump float;  
	  
 	// uniform mat4 rasterMatrix;	
	  uniform sampler2D heatmap_raster;
	  uniform int w;
	  uniform int h;
	  uniform int coef;
	  varying vec4 var_texCoord;
	// varying vec2 v_texCoord;
	
      void main() {
	 	float x = (var_texCoord[0]+1.)/2.;
	 	float y =  (var_texCoord[1] +1.)/2.;
	 	
  		vec4 fdata = texture2D(heatmap_raster, vec2(x, y));
  		
	//	gl_FragColor = col;//fdata;//vec4(1.,0.,0.,1.);
		gl_FragColor = fdata; //col;
      }
</script>