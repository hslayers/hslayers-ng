<script id="linearhist_vShader" type="x-shader/x-vertex">
	
	attribute float attr;
	//attribute float value;
	attribute vec2 index;
	

	uniform mat4 rasterMatrix;	
	uniform sampler2D filter;	
	uniform float numfilters;
	uniform float mapMatrix;
	varying vec4 col; 

	void main() {
		

		
		gl_Position = vec4((attr*2.)-1., 0., 0., 1.);
  		gl_PointSize = 1.;
  			
  		//vec4 rp = rasterMatrix * vec4(index[0],index[1],0.,1.);
  		vec4 fdata = texture2D(filter, vec2((index[0] +1.)/2. , (index[1]+1.)/2.));   
  		float val = 1.;	
  					
  			//if (fdata[0]>= ( (pow(2.,numfilters-1.)) / 256.) && numfilters != 0. ){
  			if (fdata[3]>0.){
				// data are out of the window
  				col = vec4(0., 0. , val, 1.);
  		  					
  			} 
  			else if (fdata[0]>=  ( (numfilters ) / 256.) && numfilters != 0. ){    
  				// data are selected						
				col = vec4(val, 0. , 0., 1.);
			} else {
  				// data visible but not selected
  				col = vec4(0., val , 0., 1.);
  			}
  				
  				  			
	
		
	}
</script>
    
<script id="linearhist_fShader" type="x-shader/x-fragment">
      precision mediump float;  
	  varying vec4 col; 
 	 
      void main() {
	 			
		gl_FragColor = col;
      }
</script>

