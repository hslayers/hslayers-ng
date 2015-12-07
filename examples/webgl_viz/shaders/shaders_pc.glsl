<script id="pc_vShader" type="x-shader/x-vertex">
     attribute float td;
     attribute float ti;  
     attribute vec2 indexpc;       
     
     	
    varying vec4 col;
	uniform sampler2D filter;
	
	uniform float numfilters;
      
      void main() {
	
	vec4 fdata = texture2D(filter, vec2((indexpc[0] +1.)/2. , (indexpc[1]+1.)/2.));   
  			
  					
  			//if (fdata[0]>= ( (pow(2.,numfilters-1.)) / 256.) && numfilters != 0. ){
  			
  			if (fdata[0]>=  ( (pow(2.,numfilters) -1.) / 256.) && numfilters != 0. ){    
  				// data are selected						
				gl_Position = vec4(ti*2.-1., td*2.-1.,0.,1.);    
				col = vec4(1./256.,0.,0.,1./256.);	
				
			} else {
  				// data visible but not selected
  				gl_Position = vec4(-2., -2., 0.,0.);    
  				//gl_Position = vec4(ti*2.-1., td*2.-1.,0.,1.); 
  				col = vec4(0.,0.,0., 0.);		
				//gl_Position = vec4(ti*2.-1., td*2.-1.,0.,1.); 
  			}


      }
    </script>
    
    <script id="pc_fShader" type="x-shader/x-fragment">
      precision mediump float;  
 	
	 varying vec4 col;
      
      void main() {

      
    	  gl_FragColor = col; 
       
      }
      
   
    </script>