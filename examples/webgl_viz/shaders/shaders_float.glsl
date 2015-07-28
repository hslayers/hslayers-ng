<script id="float_reader_vShader" type="x-shader/x-vertex">
		
	attribute vec4 v_texCoord;
		
	//uniform sampler2D inter_raster;
	
	varying vec4 var_texCoord;

	void main() {
		
		gl_Position = v_texCoord;
		var_texCoord =  v_texCoord;

	}
</script>
    
<script id="float_reader_fShader" type="x-shader/x-fragment">
       precision highp float;   
	  
 	// uniform mat4 rasterMatrix;	
	  uniform sampler2D raster;
	  uniform float band;
	  varying vec4 var_texCoord;
	// varying vec2 v_texCoord;
	
	
	   float shift_right(float v, float amt) {
          v = floor(v) + 0.5;
          return floor(v / exp2(amt));
        }
        
        float shift_left(float v, float amt) {
          return floor(v * exp2(amt) + 0.5);
        }
        
        float mask_last(float v, float bits) {
          return mod(v, shift_left(1.0, bits));
        }
        
        float extract_bits(float num, float from, float to) {
          from = floor(from + 0.5);
          to = floor(to + 0.5);
          return mask_last(shift_right(num, from), to - from);
        }
        
        vec4 encode_float(float val) {
          if (val == 0.0)
            return vec4(0, 0, 0, 0);
          float sign = val > 0.0 ? 0.0 : 1.0;
          val = abs(val);
          float exponent = floor(log2(val));
          float biased_exponent = exponent + 127.0;
          float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0;
         
          float t = biased_exponent / 2.0;
          float last_bit_of_biased_exponent = fract(t) * 2.0;
          float remaining_bits_of_biased_exponent = floor(t);
          
          float byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0;
          float byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0;
          float byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0;
          float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0;
          return vec4(byte4, byte3, byte2, byte1);
        }
        
      void main() {
	 	float x = (var_texCoord[0]+1.)/2.;
	 	float y =  (var_texCoord[1] +1.)/2.;
  		vec4 fdata = texture2D(raster, vec2(x, y));  		
	//	gl_FragColor = col;//fdata;//vec4(1.,0.,0.,1.);
		float val = 0.;
	  	if (band == 0.){val = fdata[0];}
	  	else if (band == 1.){val = fdata[1];}
	  	else if (band == 2.){val = fdata[2];}
	  	else if (band == 3.){val = fdata[3];}
		gl_FragColor = encode_float(val);
      }
</script>