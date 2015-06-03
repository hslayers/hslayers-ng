wgl = function(map){
	
	
	GLU.loadShaders();
	
		//r_count = 1 * Math.pow(10, 5);
	this.manager = new Manager(map.map.getTarget());
	this.mcontroller = new MapController(manager);
	
	
}