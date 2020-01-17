export default [
	"config",
	"hs.layout.service",
	"hs.layermanager.service",
	function(config, layoutService, LayMan) {
		return {
			template: require("components/layermanager/partials/basemap-gallery.html"),

			controller: [
				"$scope",
				function($scope) {
					$scope.LayMan = LayMan;
					$scope.changeBaseLayerVisibility = LayMan.changeBaseLayerVisibility;
					$scope.data = LayMan.data;
					$scope.toggleMiniMenu = function(layer) {
						if (layer.galleryMiniMenu) {
							layer.galleryMiniMenu = !layer.galleryMiniMenu;
						} else {
							layer.galleryMiniMenu = true;
						}
					};

					$scope.galleryStyle = function() {
						if (!layoutService.sidebarRight || document.getElementById("hs-layout").clientWidth <= 767) {
							return { right: "15px" };
						} else {
							return { right: layoutService.panelSpaceWidth() + 20 + "px" };
						}
					};

					$scope.fitsInContainer = () => {
						return (
							(LayMan.data.baselayers.length + 1) * 150 <
							document.getElementById("hs-layout").clientWidth - layoutService.panelSpaceWidth() - 450
						);
					};
					$scope.setGreyscale = function(layer) {
						let layerContainer = document.querySelector(".ol-unselectable > div:first-child");
						if (layerContainer.classList.contains("hs-grayscale")) {
							layerContainer.classList.remove("hs-grayscale");
							layer.grayscale = false;
						} else {
							layerContainer.classList.add("hs-grayscale");
							layer.grayscale = true;
						}
					};
				},
			],
		};
	},
];
