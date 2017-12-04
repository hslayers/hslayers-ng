define(['cesium'],

    function () {
        var $scope;
        var character;
        var viewer;
        var bad_rednering_detected_time = null;
        var rendering_resolution_reduced = false;

        function disableRightMouse(scene) {
            var screenSpaceEventHandler = viewer.screenSpaceEventHandler;
            screenSpaceEventHandler.setInputAction(function () {
                scene.screenSpaceCameraController.enableZoom = false;
            }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

            screenSpaceEventHandler.setInputAction(function () {
                scene.screenSpaceCameraController.enableZoom = true;
            }, Cesium.ScreenSpaceEventType.RIGHT_UP);

            screenSpaceEventHandler.setInputAction(function () {
                character.userInputing(true)
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

            screenSpaceEventHandler.setInputAction(function () {
                character.userInputing(false)
            }, Cesium.ScreenSpaceEventType.LEFT_UP);

            screenSpaceEventHandler.setInputAction(function () {
                character.userInputing(true)
            }, Cesium.ScreenSpaceEventType.PINCH_START);

            screenSpaceEventHandler.setInputAction(function () {
                character.userInputing(false)
            }, Cesium.ScreenSpaceEventType.PINCH_END);

            screenSpaceEventHandler.setInputAction(function () {
                character.userInputing(false)
            }, Cesium.ScreenSpaceEventType.WHEEL);
        }

        function checkBadPerformance(last_time) {
            if (!rendering_resolution_reduced && !screen_locked && parseFloat($('.cesium-performanceDisplay-fps').html()) < 20) {
                if (bad_rednering_detected_time == null) {
                    bad_rednering_detected_time = last_time;
                }
                if (last_time - bad_rednering_detected_time > 6000 && devicePixelRatio != 1) {
                    if (confirm('Reducing the resolution due to bad rendering performance?')) {
                        viewer.resolutionScale = 1.0 / devicePixelRatio;
                        bad_rednering_detected_time = null;
                        rendering_resolution_reduced = true;
                    } else {
                        rendering_resolution_reduced = true;
                    }
                }
            } else {
                bad_rednering_detected_time = null;
            }
        }

        return {
            init: function (_$scope, _$compile, _viewer, _character) {
                $scope = _$scope;
                $compile = _$compile;
                viewer = _viewer;
                character = _character;

                viewer.scene.globe.depthTestAgainstTerrain = true;
                disableRightMouse(viewer.scene);
            },
            checkBadPerformance
        }
    }
)
