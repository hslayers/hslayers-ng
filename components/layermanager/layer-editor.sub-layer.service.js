
export default ['hs.layermanager.service',
    function (LayMan) {
        let me = {};
        me.checkedSubLayers = {};
        me.withChildren = {};
        me.populatedLayers = [];
        
        me.hasSubLayers= function() {
            if (LayMan.currentLayer == null) return;
            var subLayers = LayMan.currentLayer.layer.get('Layer');
            return angular.isDefined(subLayers) && subLayers.length > 0;
        };
        
        me.getSubLayers= function() {
            if (LayMan.currentLayer == null) return;
            me.populateSubLayers();
            
            return (LayMan.currentLayer.layer.get('Layer'));
        };
        me.populateSubLayers= function() {
             if (me.populatedLayers.includes(LayMan.currentLayer.layer.ol_uid)) return
                let sublayers = (LayMan.currentLayer.layer.get('Layer'));
                if (sublayers){
                 me.populatedLayers.push(LayMan.currentLayer.layer.ol_uid)
                angular.forEach(sublayers, function (layer) {
                    if (layer.Layer) {
                        angular.extend(me.withChildren, { [layer.Name]: LayMan.currentLayer.layer.getVisible() });
                        angular.forEach(layer.Layer, function(sublayer){
                            angular.extend(me.checkedSubLayers, { [sublayer.Name]: LayMan.currentLayer.layer.getVisible() });
                        })
                    }
                    else {
                        angular.extend(me.checkedSubLayers, { [layer.Name]: LayMan.currentLayer.layer.getVisible() });
                    }
                })}
        };
        
        me.subLayerSelected= function() {
            let layer = LayMan.currentLayer;
            let src = LayMan.currentLayer.layer.getSource();
            let params = src.getParams();
            params.LAYERS = Object.keys(me.checkedSubLayers).filter(key =>
                me.checkedSubLayers[key] && !me.withChildren[key]
            ).join(',');
            if (params.LAYERS == "") {
                LayMan.changeLayerVisibility(!layer.visible, layer)
                return
            }
            if (layer.visible == false) LayMan.changeLayerVisibility(!layer.visible, layer)
            src.updateParams(params);
        };

        return me
    }
]