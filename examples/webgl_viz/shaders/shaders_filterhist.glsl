<script id="histFilter_vShader" type="x-shader/x-fragment">

      attribute vec4 FilterLines;               
     
      void main() {
		  	
  		gl_Position = FilterLines;		  		       
		gl_PointSize = 1.0;
		
 		
      }
  </script>
    
  <script id="histFilter_fShader" type="x-shader/x-vertex">
          precision mediump float;  
 			 
      void main() {     
		gl_FragColor = vec4(1.,0.,0.,0); 		
      }
  </script>