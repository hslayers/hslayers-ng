<script id="map_vShader" type="x-shader/x-vertex">
      attribute vec4 wPoint;  
      attribute vec2 index;
     
      uniform mat4 mapMatrix;
      uniform mat4 rasterMatrix;
      uniform float zoom;
 	  uniform float drawselect;   
      
      uniform sampler2D filter;
      uniform float numfilters;       
 
      varying vec4 col;
      void main() {
		
		float p_size = 1.;
		
		if (zoom > 12.) {
			p_size = zoom / 12.+2.;		
		}  	  	  		
  	    	   
  		vec4 p =  mapMatrix * wPoint;
  		//float n_speed = (speed+1.)/2.;
  		
  		vec4 rp = rasterMatrix * vec4(index[0],index[1],0.,1.);
  		vec4 fdata = texture2D(filter, vec2(rp[0],rp[1]));  		
  		
  		// if data are selected  
  		if (fdata[0]>= ( numfilters / 256.)  && numfilters != 0. &&   drawselect>0.5 ){
  			
  			col = vec4(255. /255., 140./255., 0., 0.4); 
  			gl_Position = p;    	
			gl_PointSize = p_size;
  			
  		} else if ((fdata[0] < ( numfilters / 256.)  || numfilters == 0.) && drawselect<0.5) {  	
  		   //If not selected then use blue color	   
  		   //p_size = p_size-3.;
  		   col = vec4(0., 0. , 1., 0.4);
  		   //col = vec4(0.482, 0.408, 0.533, 0.95); 	
  		   //p_size = 4.;
  		   //col = vec4(0.0,0.,0.,0.75);
  		  	gl_Position = p;    	
			gl_PointSize =  p_size;
  		} else {
  			gl_Position = vec4(-2.,-2.,0.,0.);    	
			gl_PointSize = 0.;
  		}
      }
    </script>
    
    <script id="map_fShader" type="x-shader/x-fragment">
      precision mediump float;  
 	
	  varying vec4 col;
 

   	float length(vec2 a, vec2 b){
        	return sqrt(pow((abs(a[0]-b[0])),2.)+pow((abs(a[1]-b[1])),2.));
      	}
           
      void main() {

      	float dist =  length(gl_PointCoord.xy, vec2(0.5,0.5)); 
      	
   
     	if (dist < 0.5 && dist!=0. ) {     		
     		//gl_FragColor = vec4(1., 1. / pow(0.01+dist*10.,grad),selected, 0.);//col;
     		gl_FragColor = col;  
     		//gl_FragColor = vec4(1., 0. ,0.,1.);
     	} else {
     		gl_FragColor = vec4(0., 0. ,0.,0.);//col; 
     	}
    	
       //gl_FragColor = vec4(sqrt(pow((abs(gl_PointCoord.xy[0]-0.5)),2.)), 0. ,0.,1.);//col; 
      }
      
   
    </script>