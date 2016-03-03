<script id="map_interpolation_vShader" type="x-shader/x-vertex">
      attribute vec4 wPoint;
      attribute float attr;
      attribute vec2 index;
      attribute vec4 xy;
      
      uniform mat4 mapMatrix;
      uniform mat4 rasterMatrix;
     // uniform float zoom;
 	  uniform float drawselect;   
       
    //  uniform sampler2D filter;

      varying float attrp;
      varying vec4 xyp;
      varying vec4 frag_point;
      varying mat4 mMatrix;
     
       
      void main() {
		
  	  	
  		//	float p_size = zoom*10. ;
  	 	if (attr != -99999.){
  	    	   
  			vec4 p =  mapMatrix * wPoint;
  			float n_speed = attr; //( attr+1.)/2.;
  			
  			vec4 rp = rasterMatrix * vec4(index[0],index[1],1.,0.);
  			//vec4 fdata = texture2D(filter, vec2(rp[0],rp[1]));  		
  		  	  			
  			gl_Position = p;    		
  			gl_PointSize = 100.;

        	attrp = n_speed;
 			xyp = mapMatrix * xy;
 			frag_point=mapMatrix * wPoint;
 		  	mMatrix =  mapMatrix ;
 		  }
 		  else {
 		  		gl_Position = vec4(-2.,-2.,0.,0.);    		
  				gl_PointSize = 100.;
 		  }
 		
      }
    </script>
    
    <script id="map_interpolation_fShader" type="x-shader/x-fragment">
      precision mediump float;  
 	    
	  varying float attrp;
	  varying vec4 xyp;
      varying vec4 frag_point;
      varying mat4 mMatrix;      
 
   	  uniform float zoom;

   		float length(vec4 a, vec4 b){
   		
   		 	float ax = (1./mMatrix[0][0])*a[0];
   		 	float ay = (1./mMatrix[1][1])*a[1];
   		 	
   		 	float bx = (1./mMatrix[0][0])*b[0];
   		 	float by = (1./mMatrix[1][1])*b[1];
   		 
        	return (pow((ax- bx),2.)+pow((ay- by),2.));
      	}
      
      void main() {

      float dist2 = length(frag_point, xyp);

	  float alpha = (dist2> (.02)&& attrp >0.) ? 0. : 1. ;
	  float w = 1. / (dist2*dist2);
      gl_FragColor = vec4(attrp*w, w ,0.,1.)*alpha;    
       
      }
      
   
    </script>