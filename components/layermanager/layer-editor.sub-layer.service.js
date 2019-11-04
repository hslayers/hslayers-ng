
export default ['hs.layermanager.service',
    function (LayMan) {
        let me = {};
        me.checkedSubLayers = {};
        me.withChildren = {};
        
        me.hasSubLayers= function() {
            var subLayers = me.getSubLayers();
            return angular.isDefined(subLayers) && subLayers.length > 0;
        };
        
        me.getSubLayers= function() {
            if (LayMan.currentLayer == null) return;
            me.populateSubLayers();
            return LayMan.currentLayer.layer.get('subLayers');
        };
        me.populateSubLayers= function() {
            if (Object.keys(me.checkedSubLayers).length === 0) {
                let sublayers = LayMan.currentLayer.layer.get('subLayers');
                angular.forEach(sublayers, function (layer) {
                    if (layer.children) {
                        angular.extend(me.withChildren, { [layer.name]: LayMan.currentLayer.layer.getVisible() });
                        angular.forEach(layer.children, function(sublayer){
                            angular.extend(me.checkedSubLayers, { [sublayer.name]: LayMan.currentLayer.layer.getVisible() });
                        })
                    }
                    else {
                        angular.extend(me.checkedSubLayers, { [layer.name]: LayMan.currentLayer.layer.getVisible() });
                    }
                })
            }
        };
        
        me.subLayerSelected= function() {
            let layer = LayMan.currentLayer;
            let src = LayMan.currentLayer.layer.getSource();
            let params = src.getParams();
            params.LAYERS = Object.keys(me.checkedSubLayers).filter(key =>
                me.checkedSubLayers[key] && !me.withChildren[key]
            ).join(',');
            if (params.LAYERS == '') {
                LayMan.changeLayerVisibility(!layer.visible, layer)
                return
            }
            if (layer.visible == false) LayMan.changeLayerVisibility(!layer.visible, layer)
            src.updateParams(params);
        };

        return me
    }
]