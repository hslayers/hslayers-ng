<script id="extent_vShader" type="x-shader/x-vertex">
  	  attribute vec4 wPoint;
      attribute float attr1;   
      attribute vec2 index;

         
      uniform float filterid;
      
      /*flag for spatial filter*/
      uniform float isspatial;      
      uniform mat4 mapMatrix;
 
  
      
      
      varying vec4 col;
      
      void main() {	  		
		vec4 p =  mapMatrix * wPoint;
  		   	       		
		 // if data are in the map window 
		if (-1. <= p[0] && p[0]<=1. && -1. <= p[1] && p[1]<=1.){
			col = vec4(0. , 0. , 0., 0.);
  		} else {
  			//data are out of the window
  			col = vec4(0. , 0. , 0.,  1./256.);
  		}
 	
		gl_PointSize = 	1.;
		gl_Position = vec4(index[0], index[1], 0., 1.);

      }
    </script>
    
    <script id="extent_fShader" type="x-shader/x-fragment">    
       precision mediump float;  
       
		varying vec4 col;

      	void main() {
			gl_FragColor = col;
      }
    </script>