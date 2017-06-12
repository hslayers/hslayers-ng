<script id="floathist_vShader" type="x-shader/x-vertex">
	
	
	attribute vec2 ras_vert;
	
	uniform sampler2D floatRaster;	  
	uniform float height;
	uniform float width;
	
	varying float col;

	

	void main() {
			
			float row_id = floor(ras_vert[1] / 4.); 
			float band = ras_vert[1] - row_id*4.;
			
			// normalise			
			float x = (ras_vert[0] + 0.5) / width;
			float y = (row_id + 0.5) / (height/4.);
			
			vec4 fdata = texture2D(floatRaster, vec2(x, y));
		
			gl_Position = vec4( ((ras_vert[0]+0.5)/ width)*2. -1., ((ras_vert[1]+0.5) / height)*2. -1., 0., 1.);	
			gl_PointSize = 1.0;
			//col =fdata;
			if      (band == 0.){col = fdata[0];} //selected
			else if (band == 1.){col = fdata[1];} // in in window
			else if (band == 2.){col = fdata[2];} // unselected
			else if (band == 3.){col = fdata[3];} // unselected
			else col=0.;	
			//col = 	 fdata[0];
	}
</script>
    
<script id="floathist_fShader" type="x-shader/x-fragment">
      precision highp float;   
    
	  varying float col;
	
 	
            
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
			gl_FragColor = encode_float(col);
     	}
</script>