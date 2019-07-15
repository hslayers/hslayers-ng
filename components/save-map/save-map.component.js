export default {
    template: require('components/save-map/partials/panel.html'),
    controller: ['$scope', 'hs.map.service', 'Core', 'hs.save-map.service', 'config', '$compile', 'hs.save-map.managerService',
        function ($scope, OlMap, Core, saveMap, config, $compile, StatusManager) {
            $scope.compoData = StatusManager.compoData;
            $scope.statusData = StatusManager.statusData;
            $scope.userData = StatusManager.userData;
            $scope.panel_name = 'saveMap';
            $scope.config = config;

            /**
             * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
             * @function next
             * @memberof hs.save-map
             */
            $scope.next = function () {
                if ($('a[href=#author]').parent().hasClass('active')) {
                    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveMap.map2json(OlMap.map, $scope.compoData, $scope.userData, $scope.statusData)));
                    $('#stc-download').remove();
                    $('<a id="stc-download" class="btn btn-secondary" href="data:' + data + '" download="context.hsl">Download</a>').insertAfter('#stc-next');
                    $('#stc-download').click(function () {
                        $('#stc-next').show();
                        $('#stc-download').hide();
                        $('#stc-save, #stc-saveas').hide();
                        $('.stc-tabs li:eq(0) a').tab('show');
                        Core.setMainPanel('layermanager', true);
                    })
                    $('#stc-next').hide();
                    if (Core.isAuthorized()) {
                        $('#stc-save, #stc-saveas').show();
                    }
                } else {
                    if ($('a[href=#context]').parent().hasClass('active'))
                        $('.stc-tabs li:eq(1) a').tab('show');
                    else
                        if ($('a[href=#access]').parent().hasClass('active'))
                            $('.stc-tabs li:eq(2) a').tab('show');
                }
            }
            /**
             * Show dialog about result of saving operation
             * @function showResultDialog
             * @memberof hs.save-map
             */
            $scope.showResultDialog = function () {
                if (document.getElementById("status-creator-result-dialog") == null) {
                    var el = angular.element('<div hs.save-map.result_dialog_directive></span>');
                    $compile(el)($scope);
                    document.getElementById("hs-dialog-area").appendChild(el[0]);
                } else {
                    $scope.resultModalVisible = true;
                }
            }

            $scope.showSaveDialog = function () {
                var previousDialog = document.getElementById("status-creator-save-dialog");
                if (previousDialog)
                    previousDialog.parentNode.removeChild(previousDialog);
                var el = angular.element('<div hs.save-map.save_dialog_directive></span>');
                $compile(el)($scope);
                document.getElementById("hs-dialog-area").appendChild(el[0]);
            }
            /**
             * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
             * @function confirmSave
             * @memberof hs.save-map
             */
            $scope.confirmSave = function () {
                StatusManager.confirmSave();
            }

            $scope.save = function (saveAsNew) {
                StatusManager.save(saveAsNew);
            }

            $scope.$on('StatusManager.saveResult', function (e, step, result) {
                $scope.resultCode = result;
                if (step === 'saveResult') {
                    $scope.showResultDialog();
                    $('#stc-next').show();
                    $('#stc-download').hide();
                    $('#stc-save, #stc-saveas').hide();
                    $('.stc-tabs li:eq(0) a').tab('show');
                    Core.setMainPanel('layermanager', true);

                    $('.composition-info').html($('<div>').html($scope.title)).click(function () {
                        $('.composition-abstract').toggle()
                    });
                    $('.composition-info').append($('<div>').html($scope.abstract).addClass('well composition-abstract'));
                }
                else if (step === 'saveConfirm') {
                    $scope.showSaveDialog();
                }
                else if (step === 'saveResult') {
                    $scope.showResultDialog();
                }
            })

            /**
             * Callback for saving with new title 
             * @function selectNewTitle
             * @memberof hs.save-map
             */
            $scope.selectNewTitle = function () {
                $scope.compoData.title = $scope.statusData.guessedTitle;
                $scope.changeTitle = true;
            }
            /**
             * @function focusTitle
             * @memberof hs.save-map
             */
            $scope.focusTitle = function () {
                if ($scope.statusData.guessedTitle) {
                    $scope.compoData.title = $scope.statusData.guessedTitle;
                }
                setTimeout(function () {
                    $('#hs-stc-title').focus();
                }, 0);
            };

            $scope.getCurrentExtent = function () {
                $scope.compoData.bbox = StatusManager.getCurrentExtent();
            }

            $scope.$on('core.map_reset', function (event, data) {
                $('#stc-next').show();
                $('#stc-download').hide();
                $('#stc-save, #stc-saveas').hide();
                $('.stc-tabs li:eq(0) a').tab('show');
            });

            $scope.$on('core.mainpanel_changed', function (event) {
                if (Core.mainpanel == 'saveMap') {
                    $('#stc-next').show();
                    $('#stc-download').hide();
                    $('#stc-save, #stc-saveas').hide();
                    $('.stc-tabs li:eq(0) a').tab('show');
                }
            });
            $scope.$emit('scope_loaded', "StatusCreator");
        }
    ]
}