function DataLoader() {
	this.points;
	this.attributes = [];

	this.index;
	this.cf;	
	
	this.valmin=0;
	this.valmax=0;
	var that = this;

	/**
	 * Load text file
	 */
	 $("#speed_chart").text("Please wait... data are being loaded. This may take a while.");
	
	 DataLoader.prototype.loadPosData = function(file) {
		
		
		var pts = [];
		var index = [];
		var dayes = [];
		var hours = [];
		var sev = [];
	
		var mm =[];
		mm.min = Number.MAX_VALUE;
		mm.max = Number.MIN_VALUE;
		sev.mm=mm;
		var j = 0;
				
		/**
		 * load positions
		 */
		d3.csv(file, function(error, data) {

			var rasterer = new Rasterer(data.length);
			index.r_size = rasterer.size;
			index.num_rec = data.length;

			var uids = [];
			
			data.forEach(function(val, i) {
							
					pts[j++] = parseFloat(val.x);
					pts[j++] = parseFloat(val.y);																		
					index[i] = rasterer.calc(i);	
					dayes[i] = (new Date(val.timestamp*1000)).getDay();
					hours[i] = (new Date(val.timestamp*1000)).getHours();
					sev[i] = val.accident_severity;
					sev.mm = getMinMax(sev[i], sev.mm)
				
			});
			
			that.points = array2TA(pts);
		
		
			/*for (var i = 0; i < attr.length; i++) {
				//that.attributes[i] =  array2TATrig(attr[i]);
			}*/

		
			that.num_rec = index.num_rec;
			that.raster_size = index.r_size;			
	
			
			that.index =  array2TA2D(index);
			that.sev = array2TANorm(sev, 0.5, 24);
			that.dayes = array2TANorm(dayes, -0.5, 24);
			that.hours = array2TANorm(hours, -0.5, 24);
			GLU.visualize(that);
			});
			
		

	}

	
	/**
	 * calculates the value to max pixels between -1 -1;
	 */
	Rasterer = function(max) {
		this.size = Math.ceil(Math.sqrt(max));

		this.calc = function(value) {
			var y = Math.floor(value / this.size);
			var x = value - (this.size * y);

			return [ normalise(x, this.size), normalise(y, this.size) ];
		}

	}

	/**
	 * calculates the value to max pixels between -1 -1;
	 */
	normaliseByMax = function(value, max_all, this_max, this_num) {
		/* reduced value to 0-1 */
		// var c = value/ this_max;
		var c_size = this_max / this_num;
		var v = (value / c_size) / max_all * 2 - 1;
		
		return v;
		// return 0.5;
	}

	/**
	 * calculates the value to max pixels between -1 -1;
	 */
	function normalise(value, max) {
		return value / max * 2 - 1 + (2 / (max * 2));
	}
	function array2TA(pts) {
		pts_ar = new Float32Array(pts.length);
		var i = 0;
		for (var i = 0; i < pts.length; i++) {
			pts_ar[i] = pts[i];
			pts[i] = null;
		}
		return pts_ar;
	}
	
	function array2TANorm(pts, min, norm) {
		pts_ar = new Float32Array(pts.length);
		var i = 0;
		for (var i in pts) {
			if (isNaN(pts[i])) {
				val = 0.//-99999.			
				} 
			else {
				val =  (pts[i] - min)/norm;
			}
			pts_ar[i] = val;
			//pts[i] = null;
		}
		return pts_ar;
	}
	function array2TA(pts) {
		pts_ar = new Float32Array(pts.length);
		var i = 0;
		for (var i in pts) {
			if (isNaN(pts[i])) {
				val = -99999.			
				} 
			else {
				val =  pts[i];
			}
			pts_ar[i] = val;
			pts[i] = null;
		}
		return pts_ar;
	}
	
	function array2TATrig(pts) {
		pts_ar = new Float32Array(pts.length*3);
		var kk = 0;
		for (var i = 0; i < pts.length; i++) {
			pts_ar[kk++] = pts[i];
			pts_ar[kk++] = pts[i];
			pts_ar[kk++] = pts[i];
			pts[i] = null;
		}
		return pts_ar;
	}
	
	function array2TATrigNorm(pts, min, norm) {
		pts_ar = new Float32Array(pts.length*3);
		var kk = 0;
		for (var i in pts) {
			var val;
			if (isNaN(pts[i])) {
				val = -99999.			
				} 
			else {
				val = (pts[i]-min)/norm; 
				}
			pts_ar[kk++] = val;
			pts_ar[kk++] = val;
			pts_ar[kk++] = val;
			pts[i] = null;
		}
		return pts_ar;
	}
	
	function array2TATrig2(pts) {
		pts_ar = new Float32Array(pts.length*3);
		var kk = 0;
		for (var i = 0; i < pts.length; i=i+2) {
			pts_ar[kk++] = pts[i];
			pts_ar[kk++] = pts[i+1];
			pts_ar[kk++] = pts[i];
			pts_ar[kk++] = pts[i+1];
			pts_ar[kk++] = pts[i];
			pts_ar[kk++] = pts[i+1];
			
			pts[i] = null;
		}
		return pts_ar;
	}
	
	function array2TA2D(pts) {

		pts_ar = new Float32Array(pts.length * 2);
		var i = 0;
		var j = 0;
		for (var i = 0; i < pts.length; i++) {

			pts_ar[j++] = pts[i][0];
			pts_ar[j++] = pts[i][1];
			pts[i] = null;
		}

		return pts_ar;
	}
	
	function addcolors(pts){
		var colors = d3.scale.category20();
		
		for (var i = 0; i < pts.length; i++) {
			pts[i].col = colors(i);			
		}
		return pts;
	}
	
	function getMinMax(val, minmax){
		
		if (val < minmax.min) {minmax.min = val};
		if (val > minmax.max) {minmax.max = val};
		return minmax;
		
	}
}

