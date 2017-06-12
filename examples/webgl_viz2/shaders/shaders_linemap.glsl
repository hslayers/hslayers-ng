<script id="mapline_vShader" type="x-shader/x-vertex">
     attribute vec4 wPoint;
     attribute float attr;          
     attribute vec2 index;
      
     uniform mat4 mapMatrix;  
     uniform mat4 rasterMatrix;  
     uniform float zoom;
     uniform float drawselect;                
   
     uniform sampler2D filter;
     varying vec4 col;
          
       
      void main() {
		
  	  	
  	  			
  		vec4 rp = rasterMatrix * vec4(index[0],index[1],0.,1.);
  		vec4 fdata = texture2D(filter, vec2(rp[0],rp[1]));  		
  		vec4 p ;
  		// if data are selected  
  		if (fdata[0]>=1./256. && drawselect>0.5){
  			col = vec4(attr ,1.-attr,0.,0.8);  		
  			p =  mapMatrix * wPoint;  	
  		} else if (fdata[0] < 1./256. && drawselect<0.5) {
  			col = vec4(attr ,1.-attr,0.,0.5);  		
  			p =  mapMatrix * wPoint; 
  		
  		}   		
  		else  {
  			p =  vec4(-2.,-2.,0.,0.);  	
  			col = vec4(attr ,1.-attr,0.,0.1);
  		}
  		//col = vec4(attr *5.,1.-attr*5.,0.,0.8);
  		
  	    	   
  	
    	
  	
  		  // col = vec4(0.0,0.,0.,0.75);
  		gl_Position = p;   	
		
  		
	
 		
      }
    </script>
    
    <script id="mapline_fShader" type="x-shader/x-fragment">
      precision mediump float;  
   	  varying vec4 col;
      
      void main() {
   
      gl_FragColor = col; 
       
      }
      
   
    </script>