<script id="hist_vShader" type="x-shader/x-vertex">
	
	attribute float attr;
	attribute vec2 index;
	
	//uniform mat4 mapMatrix;
	uniform mat4 rasterMatrix;
		
	
	uniform float attr_row;
	varying vec4 col; 

	void main() {
			

		
		gl_Position = vec4((attr*2.)-1., attr_row, 0., 1.);
  		gl_PointSize = 1.;
  			
  		vec4 rp = rasterMatrix * vec4(index[0],index[1],0.,1.);
  			
  					
  				
		col = vec4(0., 1. , index[0]/10000., 0.);  			
  					
			
	
		
	}
</script>
    
<script id="hist_fShader" type="x-shader/x-fragment">
      precision mediump float;  
	  varying vec4 col; 
 	 
      void main() {
	 			
		gl_FragColor = col;
      }
</script>