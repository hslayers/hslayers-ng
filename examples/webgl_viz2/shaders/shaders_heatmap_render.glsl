<script id="heatmap_render_vShader" type="x-shader/x-vertex">
		
	attribute vec4 v_texCoord;
		
	//uniform sampler2D inter_raster;
	
	
	varying vec4 var_texCoord;

	void main() {
		
		gl_Position = v_texCoord;
		var_texCoord =  v_texCoord;

	}
</script>
    
<script id="heatmap_render_fShader" type="x-shader/x-fragment">
      precision mediump float;  
	  
 	// uniform mat4 rasterMatrix;	
	  uniform sampler2D heatmap_raster;
	  
	  //min max for whole data
	  uniform float max;
	  uniform float min;
	  
	  //min max for selected data
	  uniform float max_filter;
	  uniform float min_filter;
	  uniform float reduceSelection;
	  
	  varying vec4 var_texCoord;
	// varying vec2 v_texCoord;
	  uniform mat4 colors;
	  uniform mat4 unselcolors;		
	
	  vec4 getColor(float val, mat4 colors){
        	vec4 col1;
  			vec4 col2; 
  			vec4 col; 
  			float rangeval;
  			
  			if (val >= 0.5){
  				col1 = colors[0];
  				col2 = colors[1];
  				rangeval = (val - 0.5)*2.;
  				
  			} else {
  				col1 = colors[1];
  				col2 = colors[2];
  				rangeval = val *2.;
  			
  			}			
  			col =  col1*rangeval + col2*(1.-rangeval);//vec4(val, 1.-val , 0. , 0.0+val*2.);//vec4(1.,0.,0.,0.);
  			return col;
      	}
      	
      			
      void main() {
          	      
	 	float x = (var_texCoord[0] + 1.)/2.;
	 	float y = (var_texCoord[1] + 1.)/2.;
  		vec4 fdata = texture2D(heatmap_raster, vec2(x, y));
  		vec4 col;
  		float r = 0.;
		float val;

		float t =min_filter/6. ;
		float tx =max_filter/6. ;
		//val = (fdata[0]-min_filter)/(max_filter-min_filter);	
		
		// fdata[1] 
		if ( fdata[2] > 0. && (fdata[1] < (min_filter) && fdata[1]>= (min_filter - t) ) || (fdata[1] > (max_filter) && fdata[1] <= (max_filter+tx  ))){
		
			// orange color to create the selection border
			col = vec4(1.,0.549019608,0.,1.);
		}
		
  		else if (fdata[2] > 0. && fdata[3]>0. &&  fdata[1] >= min_filter && fdata[1]<= max_filter ) {  	
  			//data are selected including spatial filter		
  			 //= floor(val*4./4.);
 			//val =  	(fdata[0] -	min_filter)  / (max_filter - min_filter);
 			val =  	fdata[0] / reduceSelection; 
  			col =   getColor(val, colors);//col1*rangeval + col2*(1.-rangeval);//vec4(val, 1.-val , 0. , 0.0+val*2.);//vec4(1.,0.,0.,0.);

  			col[3] = val*1.5+0.1;
  		//} else if (fdata[0] == min_filter && fdata[0] == max_filter){
  		//		col=vec4(1.,0.,0.,1.);
  		//}
  		}
  		else if ( fdata[3]>0. ) {
  			//data are seleted but not with spatial filter 
  			val = (fdata[1]-min)/(max-min);	
  			col =  getColor(val, unselcolors);  			
  			col[3] =  val*2. +.1;		
  			//col = vec4(val, 1.-val , 0.2 , 0.6);//vec4(1.,0.,0.,0.);
  		}	else {
  			
  			col = vec4(0.,0.,0.,0.);
  		}
  		
	
		gl_FragColor = col;//fdata;//vec4(1.,0.,0.,1.);
		
      }
</script>