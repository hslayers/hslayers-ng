<script id="mapFilter_vShader" type="x-shader/x-fragment">
      attribute vec4 poly;          
      uniform mat4 mapMatrix;
     
      void main() {
		  	
  		vec4 p = poly;		  		
        gl_Position =  mapMatrix * p;    	
		gl_PointSize = 1.0;
		
 		
      }
  </script>
    
  <script id="mapFilter_fShader" type="x-shader/x-vertex">
          precision mediump float;  
 			 
      void main() {     
		vec4 col;				
		col = vec4(1.,0.,0.,1.); 		
		gl_FragColor = col;
      }
  </script>