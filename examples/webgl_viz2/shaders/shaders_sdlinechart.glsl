<script id="sdlineChart_vShader" type="x-shader/x-fragment">

      attribute float attr;
      attribute float findex;     
      uniform sampler2D lineRaster;	
      
      varying float this_att;         
     
      void main() {
		  	
		vec4 fdata = texture2D(lineRaster, vec2((findex+1.)/2., 0.5));  
			
  		gl_Position = vec4(findex,0.,0.,1.);		  		       
		gl_PointSize = 1.0;
		this_att = abs(fdata[0]/fdata[1]-attr);
 		
      }
  </script>
    
  <script id="sdlineChart_fShader" type="x-shader/x-vertex">
          precision mediump float;  
 		
 		varying float this_att;         
     	 
      void main() {     
		gl_FragColor = vec4(this_att,1.,0.,0); 		
      }
  </script>