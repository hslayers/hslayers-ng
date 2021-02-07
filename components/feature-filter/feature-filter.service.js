import VectorLayer from 'ol/layer/Vector';
import {Style} from 'ol/style';
import {unByKey} from 'ol/Observable';
import MiniSearch from 'minisearch';

/**
 * @param $rootScope
 * @param HsLayermanagerService
 * @param HsUtilsService
 * @param HsQueryVectorService
 */
export default function (
  $rootScope,
  HsLayermanagerService,
  HsUtilsService,
  HsQueryVectorService
) {
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
        if (
          HsQueryVectorService.selector
            .getFeatures()
            .getArray()
            .indexOf(feature) == -1
        ) {
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
          case 'arrayset':
            displayFeature = function (feature) {
              if (!filter.selected || filter.selected.length === 0) {
                return true;
              }
              const arrayset = feature.getProperties()[filter.valueField];
              switch (filter.type.parameters) {
                case 'or':
                  var d = false;
                  arrayset.forEach((item) => {
                    if (filter.selected.indexOf(item) !== -1) {
                      d = true;
                    }
                  });
                  break;
                case 'and':
                default:
                  var d = true;
                  filter.selected.forEach((item) => {
                    if (arrayset.indexOf(item) == -1) {
                      d = false;
                    }
                  });
                  break;
              }
              return d;
            };
            break;
          case 'compare':
          case 'slider':
            if (filter.selected) {
              switch (filter.type.parameters) {
                case 'eq':
                  displayFeature = function (feature) {
                    return (
                      feature.getProperties()[filter.valueField] ===
                      filter.value
                    );
                  };
                  break;
                case 'neq':
                  displayFeature = function (feature) {
                    return (
                      feature.getProperties()[filter.valueField] !==
                      filter.value
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
                case 'lt':
                  displayFeature = function (feature) {
                    return (
                      feature.getProperties()[filter.valueField] < filter.value
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
                case 'gt':
                default:
                  displayFeature = function (feature) {
                    return (
                      feature.getProperties()[filter.valueField] > filter.value
                    );
                  };
              }
              break;
            }
            case 'fulltext':
              var miniSearch = new MiniSearch({
                fields: filter.valueFields,
                idField: filter.idField,
                searchOptions: { fuzzy: 0.1 }
              });
              var target = document.getElementById('fulltextInput');
              var resultIds = null;
              $rootScope.suggests = null;
              if (target != null) {
                if (target.value != null && target.value != '') {
                  var features = layer.layer.getSource().getFeatures();
                  for (var f = 0; f < features.length; f++) {
                    miniSearch.add(features[f].getProperties())
                  }

                  let results = miniSearch.search(target.value);

                  if (results != null) {
                    resultIds = results.map(({id}) => id);
                  }

                  if (filter.suggestions) {
                    let autoSuggests = miniSearch.autoSuggest(target.value);
                    if (autoSuggests != null) {
                      $rootScope.suggests = autoSuggests.map(({suggestion}) => suggestion).slice(0, 10);
                    }
                  }

                }

              }
              displayFeature = function (feature) {
                if (resultIds == null) {
                  return true
                }
                else {
                  return (
                    resultIds.indexOf(
                      feature.getProperties()[filter.idField]
                    ) !== -1
                  );
                }

              };
              break;

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
      if (!$rootScope.$$phase) {
        $rootScope.$digest();
      }
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
              case 'arrayset':
                const layersource = layer.layer.getSource();
                layersource.forEachFeature((feature) => {
                  if (
                    Array.isArray(feature.getProperties()[filter.valueField])
                  ) {
                    const arrayset = feature.getProperties()[filter.valueField];
                    arrayset.forEach((item) => {
                      if (filter.values.indexOf(item) === -1) {
                        filter.values.push(item);
                      }
                    });
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
              case 'fulltext':
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
            filter.selected === undefined &&
            filter.values &&
            filter.values.length > 0
          ) {
            switch (filter.type.type) {
              case 'fieldset':
                filter.selected = filter.values.slice(0);
                break;
              case 'arrayset':
                filter.selected = [];
                break;
            }
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
