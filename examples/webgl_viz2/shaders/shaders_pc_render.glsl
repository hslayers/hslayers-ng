<script id="pc_render_vShader" type="x-shader/x-vertex">
		
	attribute vec4 v_texCoord;
		
	//uniform sampler2D inter_raster;
	
	varying vec4 var_texCoord;

	void main() {
		
		gl_Position = v_texCoord;
		var_texCoord =  v_texCoord;

	}
</script>
    
<script id="pc_render_fShader" type="x-shader/x-fragment">
      precision mediump float;  
	  
 	// uniform mat4 rasterMatrix;	
	  uniform sampler2D heatmap_raster;
	  
	  //min for whole data	 
	  uniform float maximum;
	  uniform vec2 u_textureSize;
	  
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
		float u_kernel[9];
		vec4 pix[9];
		u_kernel[0] = u_kernel[2] = u_kernel[6] = u_kernel[8] = 1.;
		u_kernel[1] = u_kernel[3] = u_kernel[5] = u_kernel[7] = 1.; 
		u_kernel[4] = 3.;
		
		vec2 v_texCoord = vec2(x,y);
		
		if (fdata[0] == 0.) {
			col = vec4(0.,0.,0.,0.);
		} else {
			col =  getColor(fdata[0] /maximum, colors);
		}  		
			//col[3] =  fdata[0] /maximum +.1;	
			   vec2 onePixel =  vec2(1.0, 1.0) / u_textureSize;
			   
			   	float kernelWeight =
     			u_kernel[0] +
     			u_kernel[1] +
     			u_kernel[2] +
     			u_kernel[3] +
     			u_kernel[4] +
     			u_kernel[5] +
     			u_kernel[6] +
     			u_kernel[7] +
     			u_kernel[8] ;
     			if (kernelWeight <= 0.0) {
    			 kernelWeight = 1.0;
   			}
     			
     			pix[0] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(-1, -1))[0]/maximum, colors);
     			pix[1] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(0, -1))[0]/maximum, colors);
     			pix[2] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(1, -1))[0]/maximum, colors);
     			pix[3] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(-1, 0))[0]/maximum, colors);
     			pix[4] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(0, 0))[0]/maximum, colors);
     			pix[5] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(1, 0))[0]/maximum, colors);
     			pix[6] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(-1, 1))[0]/maximum, colors);
     			pix[7] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(0, 1))[0]/maximum, colors);
     			pix[8] = getColor(texture2D(heatmap_raster, v_texCoord + onePixel * vec2(1, 1))[0]/maximum, colors);
 		
     			
   				vec4 colorSum =    			
     			pix[0] * u_kernel[1] +
     			pix[1] * u_kernel[2] +
     			pix[2] * u_kernel[3] +
     			pix[3] * u_kernel[4] +
     			pix[4] * u_kernel[5] +
     			pix[5] * u_kernel[6] +
     			pix[6] * u_kernel[7] +
     			pix[7] * u_kernel[8] ;
   			

   			// val = (pix[0] / kernelWeight)[0]; 
   		    // col =  getColor(val/maximum, colors);  		
   			col = vec4((colorSum / kernelWeight).rgb, 1.0);
   			if (col[1] >= 1.){
   				col = vec4(0.,0.,0.,0.);
   			}
   			//col =  fdata;//etColor(fdata[0] /maximum, colors);
   			//col = vec4(val,0.,1.-val,1.);   		
			col[3] = fdata[0]/maximum +.0;	
		//}
		
  			
		gl_FragColor = col;//vec4(fdata[0] / 256.,0.,0.,fdata[0] /256.);//col;//fdata;//vec4(1.,0.,0.,1.);
		
      }
</script>