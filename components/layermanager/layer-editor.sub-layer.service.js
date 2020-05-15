import {coordinateRelationship} from 'ol/extent';

/**
 * @param HsLayermanagerService
 */
export default function (HsLayermanagerService) {
  'ngInject';
  const me = {};
  me.checkedSubLayers = {};
  me.withChildren = {};
  me.populatedLayers = [];

  me.hasSubLayers = function () {
    const subLayers = HsLayermanagerService.currentLayer.layer.get('Layer');
    return angular.isDefined(subLayers) && subLayers.length > 0;
  };

  me.getSubLayers = function () {
    if (HsLayermanagerService.currentLayer == null) {
      return;
    }
    me.populateSubLayers();

    return HsLayermanagerService.currentLayer.layer.get('Layer');
  };
  me.populateSubLayers = function () {
    if (
      me.populatedLayers.includes(
        HsLayermanagerService.currentLayer.layer.ol_uid
      )
    ) {
      return;
    }
    const sublayers = HsLayermanagerService.currentLayer.layer.get('Layer');
    if (sublayers) {
      me.populatedLayers.push(HsLayermanagerService.currentLayer.layer.ol_uid);
      angular.forEach(sublayers, (layer) => {
        if (layer.Layer) {
          angular.extend(
            HsLayermanagerService.currentLayer.layer.withChildren,
            {
              [layer.Name]: HsLayermanagerService.currentLayer.layer.getVisible(),
            }
          );
          angular.forEach(layer.Layer, (sublayer) => {
            angular.extend(
              HsLayermanagerService.currentLayer.layer.checkedSubLayers,
              {
                [sublayer.Name]: HsLayermanagerService.currentLayer.layer.getVisible(),
              }
            );
          });
        } else {
          angular.extend(
            HsLayermanagerService.currentLayer.layer.checkedSubLayers,
            {
              [layer.Name]: HsLayermanagerService.currentLayer.layer.getVisible(),
            }
          );
        }
      });
      me.checkedSubLayers =
        HsLayermanagerService.currentLayer.layer.checkedSubLayers;
      me.withChildren = HsLayermanagerService.currentLayer.layer.withChildren;

      HsLayermanagerService.currentLayer.layer.checkedSubLayersTmp = me.checkedSubLayersTmp = Object.assign(
        {},
        me.checkedSubLayers
      );
      HsLayermanagerService.currentLayer.layer.withChildrenTmp = me.withChildrenTmp = Object.assign(
        {},
        me.withChildren
      );

      if (!HsLayermanagerService.currentLayer.visible) {
        Object.keys(me.checkedSubLayersTmp).forEach(
          (v) => (me.checkedSubLayersTmp[v] = true)
        );
        Object.keys(me.withChildrenTmp).forEach(
          (v) => (me.withChildrenTmp[v] = true)
        );
      }
    }
  };

  me.subLayerSelected = function () {
    const layer = HsLayermanagerService.currentLayer;
    const src = HsLayermanagerService.currentLayer.layer.getSource();
    const params = src.getParams();
    params.LAYERS = Object.keys(me.checkedSubLayers)
      .filter((key) => me.checkedSubLayers[key] && !me.withChildren[key])
      .join(',');
    if (params.LAYERS == '') {
      HsLayermanagerService.changeLayerVisibility(!layer.visible, layer);
      return;
    }
    if (layer.visible == false) {
      HsLayermanagerService.changeLayerVisibility(!layer.visible, layer);
    }
    src.updateParams(params);
  };

  return me;
}
