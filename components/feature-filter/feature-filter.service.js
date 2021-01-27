import VectorLayer from 'ol/layer/Vector';
import {Style} from 'ol/style';
import {unByKey} from 'ol/Observable';

/**
 * @param $rootScope
 * @param HsLayermanagerService
 * @param HsUtilsService
 */
export default function ($rootScope, HsLayermanagerService, HsUtilsService, HsQueryVectorService) {
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
      let filteredFeatures = source.getFeatures();

      source.forEachFeature((feature) => {
        if (HsQueryVectorService.selector.getFeatures().getArray().indexOf(feature) == -1) {
          feature.setStyle(null);
        }
      });

      for (const filter of filters) {
        let displayFeature;

        switch (filter.type.type) {
          case 'fieldset':
            displayFeature = function (feature) {
              return (
                filter.selected.indexOf(
                  feature.getProperties()[filter.valueField]
                ) !== -1
              );
            };
            break;
          case 'slider':
            switch (filter.type.parameters) {
              case 'lt':
                displayFeature = function (feature) {
                  return (
                    feature.getProperties()[filter.valueField] < filter.value
                  );
                };
                break;
              case 'le':
                displayFeature = function (feature) {
                  return (
                    feature.getProperties()[filter.valueField] <= filter.value
                  );
                };
                break;
              case 'gt':
                displayFeature = function (feature) {
                  return (
                    feature.getProperties()[filter.valueField] > filter.value
                  );
                };
                break;
              case 'ge':
                displayFeature = function (feature) {
                  return (
                    feature.getProperties()[filter.valueField] >= filter.value
                  );
                };
                break;
              case 'eq':
                displayFeature = function (feature) {
                  return (
                    feature.getProperties()[filter.valueField] === filter.value
                  );
                };
                break;
            }
          default:
            displayFeature = function (feature) {
              return true;
            };
        }

        filteredFeatures = filteredFeatures.filter(displayFeature);

        source.forEachFeature((feature) => {
          if (!displayFeature(feature)) {
            feature.setStyle(new Style({}));
          }
        });
      }

      layer.filteredFeatures = filteredFeatures;
      if (!$rootScope.$$phase) $rootScope.$digest();
      return filteredFeatures;
    },

    prepLayerFilter: function (layer) {
      if ('hsFilters' in layer) {
        for (const i in layer.hsFilters) {
          const filter = layer.hsFilters[i];

          if (filter.gatherValues) {
            switch (filter.type.type) {
              case 'fieldset':
              case 'dictionary':
                const source = layer.layer.getSource();
                source.forEachFeature((feature) => {
                  if (
                    filter.values.indexOf(
                      feature.getProperties()[filter.valueField]
                    ) === -1
                  ) {
                    filter.values.push(
                      feature.getProperties()[filter.valueField]
                    );
                  }
                });

                filter.values.sort((a, b) => {
                  return (
                    (a.replace('the ', '').replace('The ', '') >
                      b.replace('the', '').replace('The ', '')) *
                      2 -
                    1
                  );
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

  const prepLayerOnLoad = $rootScope.$on(
    'layermanager.layer_added',
    (e, layer) => {
      if (HsUtilsService.instOf(layer.layer, VectorLayer)) {
        const source = layer.layer.getSource();
        if (source.getFeatures()) {
          me.prepLayerFilter(layer);
          me.applyFilters(layer);
        }
        const listenerKey = source.on('change', (e) => {
          if (source.getState() === 'ready') {
            unByKey(listenerKey);
            me.prepLayerFilter(layer);
            me.applyFilters(layer);
          }
        });
      }
    }
  );

  return me;
}
