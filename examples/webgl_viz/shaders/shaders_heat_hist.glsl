<script id="heathist_vShader" type="x-shader/x-vertex">
	
	
    attribute vec2 index;
    attribute vec4 wPoint;  
      	
	uniform mat4 mapMatrix;
	uniform mat4 rasterMatrix;
	
	uniform sampler2D filter;
	uniform sampler2D heatraster;

 	uniform float max;
	uniform float numfilters;
	varying vec4 col; 

	void main() {
		vec4 p =  mapMatrix * wPoint;
		vec4 rp = rasterMatrix * p;
		vec4 heatdata = texture2D(heatraster, vec2(rp[0],rp[1]));
  			
		
		gl_Position = vec4((heatdata[0] / max *2.) - 1. , 0. , 0., 1.);
		
		rp = rasterMatrix * vec4(index[0],index[1],0.,1.);
  		vec4 fdata = texture2D(filter, vec2(rp[0],rp[1]));  
  		
  		gl_PointSize = 1.;
  			
  						
  			if (fdata[0]>=1./256.* numfilters){  
  				// data are selected						
				col = vec4(1., 0. , 0., 0.);
  			} else if (fdata[1]>0.) {  
  				// data are unselected	     		   					
				col = vec4(0., 1. , 0., 0.);  			
  			} else if (fdata[2]>0.){
  				col = vec4(0., 0. , 1., 0.);
  			}
		//col = vec4(1., 0. , 0., 0.);
	}
</script>
    
<script id="heathist_fShader" type="x-shader/x-fragment">
      precision mediump float;  
	  varying vec4 col; 
 	 
      void main() {
	 			
		gl_FragColor = col;
      }
</script>

