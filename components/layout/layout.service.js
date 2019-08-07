export default ['Core', 'config',
    function (Core, config) {
        var me = this;

        me.data = {
            panels: [{
                enabled: true,
                order: 0,
                title: 'Map Compositions',
                description: 'List available map compositions',
                name: 'composition_browser',
                directive: 'hs.compositions.directive',
                controller: 'hs.compositions.controller',
                mdicon: 'map'
            },
            {
                enabled: true,
                order: 1,
                title: 'Manage and Style Layers',
                description: 'Manage and style your layers in composition',
                name: 'layermanager',
                directive: 'hs.layermanager.directive',
                controller: 'hs.layermanager.controller',
                mdicon: 'layers'
            },
            {
                enabled: true,
                order: 2,
                title: 'Legend',
                description: 'Display map legend',
                name: 'legend',
                directive: 'hs.legend',
                mdicon: 'format_list_bulleted'
            },
            {
                enabled: Core.singleDatasources,
                order: 3,
                title: !Core.singleDatasources ? 'Datasource Selector' : 'Add layers',
                description: 'Select data or services for your map composition',
                name: 'datasource_selector',
                directive: 'hs.datasource_selector.directive',
                controller: 'hs.datasource_selector',
                mdicon: 'dns'
            },
            {
                enabled: !Core.singleDatasources,
                order: 4,
                title: 'Add external data',
                description: 'Add external data',
                name: 'ows',
                directive: 'hs.add-layers',
                mdicon: 'library_add'
            },
            {
                enabled: true,
                order: 5,
                title: 'Measurements',
                description: 'Measure distance or area at map',
                name: 'measure',
                directive: 'hs.measure.directive',
                controller: 'hs.measure.controller',
                mdicon: 'straighten'
            },
            {
                enabled: true,
                order: 6,
                title: 'Print',
                description: 'Print map',
                name: 'print',
                directive: 'hs.print',
                mdicon: 'print'
            },
            {
                enabled: true,
                order: 7,
                title: 'Share map',
                description: 'Share map',
                name: 'permalink',
                directive: 'hs.permalink',
                mdicon: 'share'
            },
            {
                enabled: true,
                order: 8,
                title: 'Save composition',
                ngClick() { Core.openStatusCreator() },
                description: 'Save content of map to composition',
                name: 'saveMap',
                directive: 'hs.save-map.directive_panel',
                mdicon: 'save'
            }

            ]
        }

        me.panelSpaceWidth = function () {
            const panelWidths = {
                default: 400,
                datasource_selector: 700,
                ows: 700,
                composition_browser: 500
            }
            Object.assign(panelWidths, config.panelWidths);
            if (Core.sidebarExpanded && Core.sidebarVisible()) {
                if(panelWidths[Core.mainpanel]) 
                    return panelWidths[Core.mainpanel]
                else
                panelWidths.default;
            } else {
                return 48;
            }
        }

        me.widthWithoutPanelSpace = function() {
            return 'calc(100% - ' + me.panelSpaceWidth() + 'px)';
        }

        return me;
    }
]