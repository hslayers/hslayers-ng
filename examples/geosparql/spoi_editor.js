/**
 * @namespace spoi_editor
 */
define(['angular', 'ol', 'core'],

    function(angular, ol) {
        angular.module('spoi_editor', ['hs.core'])

        .service("spoi_editor", ['Core', 'hs.utils.service', '$sce', 'hs.query.service_infopanel', '$http',
            function(Core, utils, $sce, info_panel_service, $http) {
                var hr_mappings;

                function attrToEnglish(name) {
                    var hr_names = {
                        'http://xmlns.com/foaf/0.1/mbox': 'E-mail: ',
                        'http://www.openvoc.eu/poi#fax': 'Fax: ',
                        'http://xmlns.com/foaf/0.1/phone': 'Phone: ',
                        'http://www.openvoc.eu/poi#address': 'Address: ',
                        'http://www.openvoc.eu/poi#openingHours': 'Opening Hours: ',
                        'http://www.openvoc.eu/poi#access': 'Access: ',
                        'http://www.openvoc.eu/poi#accessibility': 'Accessibility: ',
                        'http://www.openvoc.eu/poi#internetAccess': 'Internet Acces: ',
                        'http://www.openvoc.eu/poi#categoryWaze': 'Category: ',
                        'http://www.openvoc.eu/poi#categoryOSM': 'Subcategory: ',
                        'http://xmlns.com/foaf/0.1/homepage': 'Homepage: ',
                        'http://www.w3.org/2000/01/rdf-schema#seeAlso': 'More info: ',
                        'http://www.w3.org/2004/02/skos/core#exactMatch': 'More info: ',
                        'http://purl.org/dc/terms/1.1/created': 'Created: ',
                        'http://www.opengis.net/ont/geosparql#sfWithin': 'Country: '
                    }
                    return hr_names[name];
                }

                function makeHumanReadable(attribute) {
                    var value = $sce.valueOf(attribute.value);
                    var name = $sce.valueOf(attribute.name);
                    if (angular.isUndefined(hr_mappings[name])) {
                        if (value.indexOf('http:') == 0) {
                            return $sce.trustAsHtml('<a href="' + value + '">' + value + '</a>');
                        } else {
                            return value;
                        }
                    }
                    if (angular.isDefined(hr_mappings[name][value])) return hr_mappings[name][value];
                    else return attribute.value;
                }

                function saveSpoiChanges(attributes) {
                    var identifier = '';
                    var changes = [];
                    angular.forEach(attributes, function(a) {
                        if (angular.isDefined(a.changed) && a.changed) {
                            changes.push({
                                attribute: a.name,
                                value: $sce.valueOf(a.value)
                            });
                            info_panel_service.feature.set(a.name, $sce.valueOf(a.value));
                        }
                        if (a.name == 'http://purl.org/dc/elements/1.1/identifier') identifier = $sce.valueOf(a.value);
                    })
                    var lines = [];
                    var d = new Date();
                    var n = d.toISOString();
                    var change_id = 'http://www.sdi4apps.eu/poi_changes/change_' + utils.generateUuid();
                    var attribute_set_id = 'http://www.sdi4apps.eu/poi_changes/attributes_' + utils.generateUuid();
                    lines.push('<' + change_id + '> <http://www.sdi4apps.eu/poi_changes/poi_id> <' + identifier + '>');
                    lines.push('<' + change_id + '> <http://purl.org/dc/terms/1.1/created> "' + n + '"^^xsd:dateTime');
                    lines.push('<' + change_id + '> <http://www.sdi4apps.eu/poi_changes/attribute_set> <' + attribute_set_id + '>');
                    angular.forEach(changes, function(a) {
                        lines.push('<' + attribute_set_id + '> <' + a.attribute + '> "' + a.value + '"');
                    })

                    var query = ['INSERT DATA { GRAPH <http://www.sdi4apps.eu/poi_changes.rdf> {', lines.join('.'), '}}'].join('\n');
                    $http.get('http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent(query) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
                        )
                        .then(function(response) {
                            angular.forEach(attributes, function(a) {
                                if (angular.isDefined(a.changed) && a.changed) {
                                    delete a.changed;
                                }
                            })
                            if (!$scope.$$phase) $scope.$digest();
                        });
                }

                function filterAttribs(items) {
                    var filtered = [];
                    var frnly_attribs = ['http://www.openvoc.eu/poi#categoryWaze', 'http://www.openvoc.eu/poi#categoryOSM', 'http://www.w3.org/2000/01/rdf-schema#comment', 'http://xmlns.com/foaf/0.1/mbox', 'http://www.openvoc.eu/poi#fax', 'http://www.opengis.net/ont/geosparql#sfWithin', 'http://www.w3.org/2004/02/skos/core#exactMatch', 'http://www.w3.org/2000/01/rdf-schema#seeAlso', 'http://xmlns.com/foaf/0.1/homepage', 'http://purl.org/dc/terms/1.1/created']
                    angular.forEach(items, function(item) {
                        if (frnly_attribs.indexOf(item.name) > -1) {
                            filtered.push(item);
                        }
                    });
                    return filtered;
                };
                
                function addPoi(layer, coordinate){
                    var identifier = 'http://www.sdi4apps.eu/new_poi/'+ utils.generateUuid();
                    var attrs = {
                        geometry: new ol.geom.Point(coordinate),
                        'http://purl.org/dc/elements/1.1/identifier': identifier,
                        'http://www.w3.org/2000/01/rdf-schema#label': 'New point',
                        'http://purl.org/dc/elements/1.1/title': 'New point' 
                    };
                    
                    var lines = [];
                    lines.push('<' + identifier + '> <http://purl.org/dc/elements/1.1/identifier> "' + identifier + '"');
                    var format = new ol.format.WKT();
                    lines.push('<' + identifier + '> <http://www.opengis.net/ont/geosparql#asWKT> "' + format.writeGeometry(attrs.geometry.transform('EPSG:3857', 'EPSG:4326')) + '"^^virtrdf:Geometry');
                    lines.push('<' + identifier + '> <'+layer.getSource().options.category_field+ '> <' + layer.get('category') + '>');
                    lines.push('<' + identifier + '> <http://purl.org/dc/elements/1.1/title> "New point"');
                    var query = ['prefix virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> INSERT DATA { GRAPH <http://www.sdi4apps.eu/poi_changes.rdf> {', lines.join('.'), '}}'].join('\n');
                    $http.get('http://data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent(query) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
                        )
                        .then(function(response) {
                        });
                        
                    attrs[layer.getSource().options.category_field] = layer.get('category');
                    var feature = new ol.Feature(attrs);
                    layer.getSource().addFeatures([feature]);
                }

                function startEdit(attribute, x) {
                    attribute.is_editing = !(angular.isDefined(attribute.is_editing) && attribute.is_editing);
                }

                function attributesHaveChanged(attributes) {
                    var tmp = false;
                    angular.forEach(attributes, function(a) {
                        if (angular.isDefined(a.changed) && a.changed) tmp = true;
                    })
                    return tmp;
                }

                function editDropdownVisible(attribute) {
                    return attribute.is_editing && angular.isDefined(getSpoiCategories(attribute.name));
                }

                function editTextboxVisible(attribute) {
                    return attribute.is_editing && angular.isUndefined(getSpoiCategories(attribute.name));
                }

                function init(hr_map) {
                    hr_mappings = hr_map
                }

                function getSpoiCategories(group) {
                    return hr_mappings[group];
                }

                var me = {
                    init: init,
                    attrToEnglish: attrToEnglish,
                    makeHumanReadable: makeHumanReadable,
                    saveSpoiChanges: saveSpoiChanges,
                    filterAttribs: filterAttribs,
                    startEdit: startEdit,
                    attributesHaveChanged: attributesHaveChanged,
                    editDropdownVisible: editDropdownVisible,
                    editTextboxVisible: editTextboxVisible,
                    addPoi: addPoi
                }
                return me;
            }
        ])
    })
