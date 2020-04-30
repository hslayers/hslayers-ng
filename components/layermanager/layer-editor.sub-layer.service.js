import {coordinateRelationship} from 'ol/extent';

export default [
  'hs.layermanager.service',
  function (LayMan) {
    const me = {};
    me.checkedSubLayers = {};
    me.withChildren = {};
    me.populatedLayers = [];

    me.hasSubLayers = function () {
      const subLayers = LayMan.currentLayer.layer.get('Layer');
      return angular.isDefined(subLayers) && subLayers.length > 0;
    };

    me.getSubLayers = function () {
      if (LayMan.currentLayer == null) {
        return;
      }
      me.populateSubLayers();

      return LayMan.currentLayer.layer.get('Layer');
    };
    me.populateSubLayers = function () {
      if (me.populatedLayers.includes(LayMan.currentLayer.layer.ol_uid)) {
        return;
      }
      const sublayers = LayMan.currentLayer.layer.get('Layer');
      if (sublayers) {
        me.populatedLayers.push(LayMan.currentLayer.layer.ol_uid);
        angular.forEach(sublayers, (layer) => {
          if (layer.Layer) {
            angular.extend(LayMan.currentLayer.layer.withChildren, {
              [layer.Name]: LayMan.currentLayer.layer.getVisible(),
            });
            angular.forEach(layer.Layer, (sublayer) => {
              angular.extend(LayMan.currentLayer.layer.checkedSubLayers, {
                [sublayer.Name]: LayMan.currentLayer.layer.getVisible(),
              });
            });
          } else {
            angular.extend(LayMan.currentLayer.layer.checkedSubLayers, {
              [layer.Name]: LayMan.currentLayer.layer.getVisible(),
            });
          }
        });
        me.checkedSubLayers = LayMan.currentLayer.layer.checkedSubLayers;
        me.withChildren = LayMan.currentLayer.layer.withChildren;
        LayMan.currentLayer.layer.baseParams = LayMan.currentLayer.layer
          .getSource()
          .getParams().LAYERS;
      }
    };

    me.subLayerSelected = function () {
      const layer = LayMan.currentLayer;
      const src = LayMan.currentLayer.layer.getSource();
      const params = src.getParams();
      params.LAYERS = Object.keys(me.checkedSubLayers)
        .filter((key) => me.checkedSubLayers[key] && !me.withChildren[key])
        .join(',');
      if (params.LAYERS == '') {
        LayMan.changeLayerVisibility(!layer.visible, layer);
        return;
      }
      if (layer.visible == false) {
        LayMan.changeLayerVisibility(!layer.visible, layer);
      }
      src.updateParams(params);
    };

    return me;
  },
];
