/**
 * @namespace spoi_editor
 */
define(['angular', 'ol', 'core'],

    function(angular, ol) {
        angular.module('spoi_editor', ['hs.core'])

        .service("spoi_editor", ['Core', 'hs.utils.service', '$sce', 'hs.query.baseService', '$http',
            function(Core, utils, $sce, queryService, $http) {
                var hr_mappings = {};
                //Atributes which are displayed without clicking 'For developer' button
                var frnly_attribs = ['http://www.openvoc.eu/poi#class', 'http://www.w3.org/2000/01/rdf-schema#comment', 'http://xmlns.com/foaf/0.1/mbox', 'http://www.openvoc.eu/poi#fax', 'http://xmlns.com/foaf/0.1/homepage', 'http://xmlns.com/foaf/0.1/depiction', 'http://www.openvoc.eu/poi#openingHours', 'http://www.openvoc.eu/poi#internetAccess','http://www.openvoc.eu/poi#accessibility', 'http://www.openvoc.eu/poi#address']
                var not_editable_attrs = ['poi_id', 'http://www.opengis.net/ont/geosparql#sfWithin', 'http://purl.org/dc/elements/1.1/identifier', 'http://purl.org/dc/elements/1.1/publisher', 'http://purl.org/dc/terms/1.1/created', 'http://www.w3.org/2004/02/skos/core#exactMatch', 'http://www.sdi4apps.eu/poi/#mainCategory', 'http://www.w3.org/2002/07/owl#sameAs']
                
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
                        'http://www.openvoc.eu/poi#class': 'Category: ',
                        'http://xmlns.com/foaf/0.1/homepage': 'Homepage: ',
                        'http://www.w3.org/2000/01/rdf-schema#seeAlso': 'More info: ',
                        'http://www.w3.org/2004/02/skos/core#exactMatch': 'More info: ',
                        'http://purl.org/dc/terms/1.1/created': 'Created: ',
                        'http://www.opengis.net/ont/geosparql#sfWithin': 'Country: ',
                        'http://www.w3.org/2000/01/rdf-schema#comment': 'Comments: ',
                        'http://xmlns.com/foaf/0.1/depiction': 'Photo: '
                    }
                    return hr_names[name];
                }

                function makeHumanReadable(attribute) {
                    var value = $sce.valueOf(attribute.value);
                    var name = $sce.valueOf(attribute.name);
                    if (angular.isUndefined(hr_mappings[name])) {
                        if (name.indexOf('depiction')>0){
                            return $sce.trustAsHtml('<a target="_blank" href="' + value + '"><img src="' + value + '" class="img-thumbnail"/></a>');
                        } else 
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
                            queryService.feature.set(a.name, $sce.valueOf(a.value));
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
                    lines.push('<' + change_id + '> <http://www.sdi4apps.eu/poi_changes/status> "unchecked"');
                    lines.push('<' + change_id + '> <http://www.sdi4apps.eu/poi_changes/attribute_set> <' + attribute_set_id + '>');
                    angular.forEach(changes, function(a) {
                        lines.push('<' + attribute_set_id + '> <' + a.attribute + '> "' + a.value + '"');
                    })

                    var query = ['INSERT DATA { GRAPH <http://www.sdi4apps.eu/poi_changes.rdf> {', lines.join('.'), '}}'].join('\n');
                    $http.get('http://data.plan4all.eu/sparql_spoi?default-graph-uri=&query=' + encodeURIComponent(query) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on')
                        .then(function(response) {
                            angular.forEach(attributes, function(a) {
                                if (angular.isDefined(a.changed) && a.changed) {
                                    delete a.changed;
                                }
                            })
                        });
                }
                
                function cancelSpoiChanges(attributes) {
                    angular.forEach(attributes, function(a) {
                        if (angular.isDefined(a.changed) && a.changed) {
                           a.value = a.original_value;
                           a.changed = false;
                           a.is_editing = false;
                        }
                    });
                }

                function filterAttribs(items) {
                    var filtered = [];
                    angular.forEach(items, function(item) {
                        if (frnly_attribs.indexOf(item.name) > -1 || item.name.indexOf('depiction')>0) {
                            filtered.push(item);
                        }
                    });
                    return filtered;
                };

                function addPoi(layer, coordinate, country_last_clicked, category) {
                    var identifier = 'http://www.sdi4apps.eu/new_poi/' + utils.generateUuid();
                    me.id = identifier;
                    var now = new Date();
                    var attrs = {
                        geometry: new ol.geom.Point(coordinate),
                        'http://purl.org/dc/elements/1.1/identifier': identifier,
                        'http://www.w3.org/2000/01/rdf-schema#label': 'New point',
                        'http://purl.org/dc/elements/1.1/title': 'New point',
                        'http://www.opengis.net/ont/geosparql#sfWithin': 'http://www.geonames.org/' + country_last_clicked.geonameId,
                        'http://purl.org/dc/elements/1.1/publisher': "SPOI (http://sdi4apps.eu/spoi)",
                        'http://purl.org/dc/elements/1.1/source': "",
                        'http://purl.org/dc/elements/1.1/rights': "http://opendatacommons.org/licenses/odbl/1.0/",
                        'http://www.sdi4apps.eu/poi/#mainCategory':  layer.get('category'), //For choosing the icon,
                        'http://purl.org/dc/terms/1.1/created': now.toISOString(),
                        'http://www.sdi4apps.eu/poi_changes/status': "unchecked"
                    };
                    angular.forEach(frnly_attribs, function(default_attrib){
                        if(angular.isUndefined(attrs[default_attrib])){
                            attrs[default_attrib] = "";
                        }
                    })

                    var lines = [];
                    lines.push('<{0}> <http://purl.org/dc/elements/1.1/identifier> "{0}"'.format(identifier));
                    var format = new ol.format.WKT();
                    var wkt = format.writeGeometry(attrs.geometry.clone().transform('EPSG:3857', 'EPSG:4326'));
                    lines.push('<{0}> <http://www.opengis.net/ont/geosparql#asWKT> "{1}"^^virtrdf:Geometry'.format(identifier, wkt));
                    lines.push('<{0}> <{1}> <{2}>'.format(identifier, layer.getSource().options.category_field, category));
                    angular.forEach(attrs, function(value, attr){
                        //Geometry has different name in virtuoso, mainCategory is calculated on client side, but depiction is either valid url or doesnt exist in data at all
                        if(attr != 'geometry' && attr != layer.getSource().options.category_field && attr != 'http://www.sdi4apps.eu/poi/#mainCategory' && attr != 'http://xmlns.com/foaf/0.1/depiction') {
                            lines.push('<{0}> <{1}> "{2}"'.format(identifier, attr, value));
                        }
                    });
                    var query = ['prefix virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> INSERT DATA { GRAPH <http://www.sdi4apps.eu/poi_changes.rdf> {', lines.join('.'), '}}'].join('\n');
                    $http.get('http://data.plan4all.eu/sparql_spoi?default-graph-uri=&query=' + encodeURIComponent(query) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on')
                        .then(function(response) {});

                    attrs[layer.getSource().options.category_field] = category;
                    var feature = new ol.Feature(attrs);
                    layer.getSource().addFeatures([feature]);
                    return feature;
                }

                function startEdit(attribute, x) {
                    if (angular.isUndefined(attribute.changed) || !attribute.changed) 
                        attribute.original_value = attribute.value;
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
                    return attribute.is_editing && angular.isDefined(getSpoiDropdownItems(attribute.name)) && (attribute.name.indexOf('#class')<=0);
                }
                
                function editCategoryDropdownVisible(attribute) {
                    return attribute.is_editing && angular.isDefined(getSpoiCategories()) && (attribute.name.indexOf('#class')>0);
                }

                function editTextboxVisible(attribute) {
                    return attribute.is_editing;
                }

                function init() {
                    hr_mappings = {};
                }

                function getSpoiCategories() {
                    return hr_mappings.category_hierarchy;
                }
                
                function getSpoiDropdownItems(group) {
                    return hr_mappings[group];
                }
                
                function registerCategory(main_category, main_label, sub_category, sub_label){
                    var o = {"http://www.openvoc.eu/poi#class": {}};
                    if(main_category != null){
                        var json_sub_category = {};
                        json_sub_category[sub_category] = sub_label;
                        var json_main_category = {};
                        json_main_category[main_category] = json_sub_category;   
                        o["category_hierarchy"] = json_main_category;
                    }
                    o["http://www.openvoc.eu/poi#class"][sub_category] = sub_label;
                    o["http://www.openvoc.eu/poi#class"][main_category] = main_label;
                    hr_mappings = angular.merge({}, hr_mappings, o);
                }
                
                function getCategoryHierarchy(){
                    return hr_mappings.category_hierarchy;
                }
                
                function extendMappings(x){
                    hr_mappings = angular.merge({}, hr_mappings, x);
                }
                
                function getFriendlyAttribs(){
                    return frnly_attribs;
                }
                
                function getNotEditableAttrs(){
                    return not_editable_attrs;
                }

                var me = {
                    init: init,
                    extendMappings: extendMappings,
                    attrToEnglish: attrToEnglish,
                    makeHumanReadable: makeHumanReadable,
                    saveSpoiChanges: saveSpoiChanges,
                    cancelSpoiChanges: cancelSpoiChanges,
                    filterAttribs: filterAttribs,
                    startEdit: startEdit,
                    attributesHaveChanged: attributesHaveChanged,
                    editDropdownVisible: editDropdownVisible,
                    editCategoryDropdownVisible: editCategoryDropdownVisible,
                    getSpoiDropdownItems: getSpoiDropdownItems,
                    editTextboxVisible: editTextboxVisible,
                    addPoi: addPoi,
                    getSpoiCategories: getSpoiCategories,
                    registerCategory: registerCategory,
                    getCategoryHierarchy: getCategoryHierarchy,
                    getFriendlyAttribs: getFriendlyAttribs,
                    getNotEditableAttrs: getNotEditableAttrs
                }
                return me;
            }
        ])
    })
