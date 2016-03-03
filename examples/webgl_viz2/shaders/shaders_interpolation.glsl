<script id="interpolation_vShader" type="x-shader/x-vertex">
		
	attribute vec4 v_texCoord;
		
//	uniform sampler2D inter_raster;
	
	varying vec4 var_texCoord;

	void main() {
		
		gl_Position = v_texCoord;
		var_texCoord =  v_texCoord;

	}
</script>
    
<script id="interpolation_fShader" type="x-shader/x-fragment">
      precision mediump float;  
	  
 	// uniform mat4 rasterMatrix;	
	  uniform sampler2D inter_raster;
	  varying vec4 var_texCoord;
	// varying vec2 v_texCoord;
	
      void main() {
	 	float x = (var_texCoord[0]+1.)/2.;
	 	float y =  (var_texCoord[1] +1.)/2.;
  		vec4 fdata = texture2D(inter_raster, vec2(x, y));
  		vec4 col;
  		 
	


  		float val = fdata[0] / fdata[1];
  		if (fdata[0] != 0. && fdata[3] >2.) {
  			if (val>=0. && val <=0.125){ col = 		vec4(255./256.,255./256.,217./256.,.5);}
  			else if (val>0.125 && val <=0.25)  { col = vec4(237./256.,248./256.,177./256.,.5);}  		
  			else if (val>0.25  && val <=0.375)  { col = vec4(199./256.,233./256.,180./256.,.5);}
  			else if (val>0.375 && val <=0.5)  { col = vec4(127./256.,205./256.,187./256.,.5);}  		
  			else if (val>0.5 && val <=0.625)  { col = vec4(65./256.,182./256.,196./256.,.5);}
  			else if (val>0.625 && val <=0.75)  { col = vec4(29./256.,145./256.,192./256.,.5);}
  	 		else if (val>0.75 && val <=0.875)  { col = vec4(34./256.,94./256.,168./256.,.5);}
  	 		else if (val>0.875 && val <=1.)  { col = vec4(12./256.,44./256.,132./256.,.5);}
			else {col = vec4(179./256.,0.,0.,.5);}
  			//col = vec4(.1,val+0.1,1.-val,1.);
  		}	else {
  			col = vec4(0.,0.,0.,0.);
  		}
  			
	
		gl_FragColor = col;
	//	gl_FragColor = fdata;
      }
</script>