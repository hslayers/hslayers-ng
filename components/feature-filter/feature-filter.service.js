import Observable from 'ol/Observable';
import VectorLayer from 'ol/layer/Vector';
import {Style} from 'ol/style';

/**
 * @param $rootScope
 * @param HsLayermanagerService
 * @param HsUtilsService
 */
export default function ($rootScope, HsLayermanagerService, HsUtilsService) {
  'ngInject';
  const me = {
    applyFilters: function (layer) {
      if (!layer) {
        if (angular.isUndefined(HsLayermanagerService.currentLayer)) {
          return;
        }
        layer = HsLayermanagerService.currentLayer;
      }

      const source = layer.layer.getSource();

      if (!('hsFilters' in layer)) {
        return source.getFeatures();
      }
      if (!layer.hsFilters) {
        return source.getFeatures();
      }

      const filters = layer.hsFilters;
      const filteredFeatures = [];

      source.forEachFeature((feature) => {
        feature.setStyle(null);
      });

      for (const i in filters) {
        var filter = filters[i];
        var displayFeature;

        switch (filter.type.type) {
          case 'fieldset':
            if (filter.selected.length === 0) {
              displayFeature = function (feature, filter) {
                return true;
              };
              break;
            }
            displayFeature = function (feature, filter) {
              return (
                filter.selected.indexOf(feature.getProperties()[filter.valueField]) !==
                -1
              );
            };
            break;
          case 'slider':
            switch (filter.type.parameters) {
              case 'lt':
                displayFeature = function (feature, filter) {
                  return feature.getProperties()[filter.valueField] < filter.value;
                };
                break;
              case 'le':
                displayFeature = function (feature, filter) {
                  return feature.getProperties()[filter.valueField] <= filter.value;
                };
                break;
              case 'gt':
                displayFeature = function (feature, filter) {
                  return feature.getProperties()[filter.valueField] > filter.value;
                };
                break;
              case 'ge':
                displayFeature = function (feature, filter) {
                  return feature.getProperties()[filter.valueField] >= filter.value;
                };
                break;
              case 'eq':
                displayFeature = function (feature, filter) {
                  return feature.getProperties()[filter.valueField] === filter.value;
                };
                break;
            }
          default:
            displayFeature = function (feature, filter) {
              return true;
            };
        }

        source.forEachFeature((feature) => {
          if (!displayFeature(feature, filter)) {
            feature.setStyle(new Style({}));
          } else {
            filteredFeatures.push(feature);
          }
        });
      }

      layer.filteredFeatures = filteredFeatures;
      return filteredFeatures;
    },

    prepLayerFilter: function (layer) {
      if ('hsFilters' in layer) {
        for (const i in layer.hsFilters) {
          var filter = layer.hsFilters[i];

          if (filter.gatherValues) {
            switch (filter.type.type) {
              case 'fieldset':
              case 'dictionary':
                var source = layer.layer.getSource();
                source.forEachFeature((feature) => {
                  if (
                    filter.values.indexOf(
                      feature.getProperties()[filter.valueField]
                    ) === -1
                  ) {
                    filter.values.push(feature.getProperties()[filter.valueField]);
                  }
                });
                break;
              case 'dateExtent':
                // // TODO: create time range from date extents of the features, convert datetime fields to datetime datatype
                // if (filter.range === undefined) filter.range = [];

                // var source = layer.layer.getSource();
                // source.forEachFeature(function (feature) {
                //     if (feature.getProperties()[filter.valueField] < filter.range[0] || filter.range[0] === undefined) {
                //         filter.range[0] = feature.getProperties()[filter.valueField];
                //     }
                //     if (feature.getProperties()[filter.valueField] > filter.range[1] || filter.range[1] === undefined) {
                //         filter.range[1] = feature.getProperties()[filter.valueField];
                //     }
                // });
                break;
            }
          }

          if (
            filter.type.type === 'fieldset' &&
            filter.selected === undefined &&
            filter.values.length > 0
          ) {
            filter.selected = filter.values.slice(0);
          }
        }
      }
    },
  };

  $rootScope.$on('layermanager.layer_added', (e, layer) => {
    // me.prepLayerFilter(layer);

    // if (HsUtilsService.instOf(layer.layer, VectorLayer)) {
    //   const source = layer.layer.getSource();
    //   console.log(source.getState());
    //   var listenerKey = source.on('change', (e) => {
    //     if (source.getState() === 'ready') {
    //       console.log(source.getState());
    //       Observable.unByKey(listenerKey);
    //       me.prepLayerFilter(layer);
    //       me.applyFilters(layer);
    //     }
    //   });
    // }
  });

  return me;
}
