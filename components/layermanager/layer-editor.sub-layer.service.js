import {coordinateRelationship} from 'ol/extent';

export default [
  'HsLayermanagerService',
  function (LayerManager) {
    const me = {};
    me.checkedSubLayers = {};
    me.withChildren = {};
    me.populatedLayers = [];

    me.hasSubLayers = function () {
      const subLayers = LayerManager.currentLayer.layer.get('Layer');
      return angular.isDefined(subLayers) && subLayers.length > 0;
    };

    me.getSubLayers = function () {
      if (LayerManager.currentLayer == null) {
        return;
      }
      me.populateSubLayers();

      return LayerManager.currentLayer.layer.get('Layer');
    };
    me.populateSubLayers = function () {
      if (me.populatedLayers.includes(LayerManager.currentLayer.layer.ol_uid)) {
        return;
      }
      const sublayers = LayerManager.currentLayer.layer.get('Layer');
      if (sublayers) {
        me.populatedLayers.push(LayerManager.currentLayer.layer.ol_uid);
        angular.forEach(sublayers, (layer) => {
          if (layer.Layer) {
            angular.extend(LayerManager.currentLayer.layer.withChildren, {
              [layer.Name]: LayerManager.currentLayer.layer.getVisible(),
            });
            angular.forEach(layer.Layer, (sublayer) => {
              angular.extend(LayerManager.currentLayer.layer.checkedSubLayers, {
                [sublayer.Name]: LayerManager.currentLayer.layer.getVisible(),
              });
            });
          } else {
            angular.extend(LayerManager.currentLayer.layer.checkedSubLayers, {
              [layer.Name]: LayerManager.currentLayer.layer.getVisible(),
            });
          }
        });
        me.checkedSubLayers = LayerManager.currentLayer.layer.checkedSubLayers;
        me.withChildren = LayerManager.currentLayer.layer.withChildren;

        LayerManager.currentLayer.layer.checkedSubLayersTmp = me.checkedSubLayersTmp = Object.assign({}, me.checkedSubLayers);
        LayerManager.currentLayer.layer.withChildrenTmp = me.withChildrenTmp = Object.assign({}, me.withChildren);
        
        if(!LayerManager.currentLayer.visible){
          Object.keys(me.checkedSubLayersTmp).forEach(v => me.checkedSubLayersTmp[v] = true);
          Object.keys(me.withChildrenTmp).forEach(v => me.withChildrenTmp[v] = true)
        }
      }
    };

    me.subLayerSelected = function () {
      const layer = LayerManager.currentLayer;
      const src = LayerManager.currentLayer.layer.getSource();
      const params = src.getParams();
      params.LAYERS = Object.keys(me.checkedSubLayers)
        .filter((key) => me.checkedSubLayers[key] && !me.withChildren[key])
        .join(',');
      if (params.LAYERS == '') {
        LayerManager.changeLayerVisibility(!layer.visible, layer);
        return;
      }
      if (layer.visible == false) {
        LayerManager.changeLayerVisibility(!layer.visible, layer);
      }
      src.updateParams(params);
    };

    return me;
  },
];
