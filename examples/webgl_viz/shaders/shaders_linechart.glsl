<script id="lineChart_vShader" type="x-shader/x-fragment">

      attribute float attr;
      attribute float findex;    
      uniform float zoom;
      uniform float translate;
       
      varying float this_att;         
     
      void main() {
		  	gl_Position = vec4(( (findex-translate)*2. -1.)*zoom,0.,0.,1.);		  		       
			gl_PointSize = 1.0;
		  
		  	this_att = attr;
 		
      }
  </script>
    
  <script id="lineChart_fShader" type="x-shader/x-vertex">
          precision mediump float;  
 		
 		varying float this_att;         
     	 
      void main() {     
       if (this_att == -99999.){
         gl_FragColor = vec4(0. ,0.,1., 0.); 		
       } else {
         gl_FragColor = vec4(this_att,1.,0.,0); 		
       }
		
      }
  </script>