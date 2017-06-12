<script id="mapColorFilter_vShader" type="x-shader/x-fragment">
      attribute vec4 v_texCoord;          
      
     
      varying vec4 var_texCoord;
      
      void main() {
		
		  	
  		vec4 p =  v_texCoord;		  		
        gl_Position =  p;    	
		gl_PointSize = 1.0;
		var_texCoord =  v_texCoord;
 		
      }
  </script>
    
  <script id="mapColorFilter_fShader" type="x-shader/x-vertex">
          precision mediump float;  
      
      uniform float val_min;
      uniform float val_max;
      uniform sampler2D heatmap_raster;      
      varying vec4 var_texCoord;
      
      void main() {     
		vec4 col;		
		
		float x =  (var_texCoord[0]+1.)/2.;
	 	float y =  (var_texCoord[1] +1.)/2.;
  		vec4 fdata = texture2D(heatmap_raster, vec2(x, y));
  		float v;
  		if (fdata[1] > val_min && fdata[1] < val_max ){
  			v = 1.;
  		}	else {
  			v=0.;
  		} 	
		col = vec4(v,0.,0.,1.); 		
		gl_FragColor = col;
      }
  </script>