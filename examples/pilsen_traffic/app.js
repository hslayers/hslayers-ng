'use strict';

define(['ol',
        'moment',
        'sidebar',
        //'toolbar',
        'layermanager',
        'query',
        'search',
        'print',
        'permalink',
        'measure',
        'bootstrap',
        'geolocation',
        'api',
        'drag',
        'compositions',
        'pilsentraffic',
        'calendar',
        'ngtimeline'
    ],
    function(ol, moment) {
        var module = angular.module('hs', [
            //'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.print',
            'hs.permalink',
            'hs.geolocation',
            'hs.api',
            'hs.sidebar',
            'hs.drag',
            'hs.compositions',
            'hs.pilsentraffic',
            'hs.calendar',
            'ngTimeline'
        ]);

        module.directive(
            'hs', [
                'hs.map.service', 'Core',
                function(OlMap, Core) {
                    return {
                        templateUrl: hsl_path + 'hslayers.html',
                        link: function(scope, element) {
                            Core.fullScreenMap(element);
                        }
                    };
                }
            ]);

        module.directive('hs.advancedInfopanelDirective', function() {
            return {
                templateUrl: 'partials/advanced_info.html?bust=' + gitsha,
                link: function(scope, element, attrs) {
                    $('#advanced-info-dialog').modal('show');
                }
            };
        });
    
        module.directive('hs.topmenu', function() {
            return {
                templateUrl: 'partials/top-menu.html?bust=' + gitsha
            };
        });
    
        module.directive('hs.basemapmenu', function() {
            return {
                templateUrl: 'partials/basemap-menu.html?bust=' + gitsha,
                controller: 'hs.layermanager.controller'
            };
        });
    
        module.directive('hs.trafficmenu', function () {
      
            var controller = ['$scope', function ($scope) {
                
                $scope.items = ["Události", "Uzavírky", "Stupně provozu", "Kamery"];
                
            }];

            return {
                restrict: 'A',
                controller: controller,
                templateUrl: 'partials/traffic-menu.html?bust=' + gitsha
            };
          });

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "Base layer",
                    base: true
                }),
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "OSM1",
                    base: true
                }),
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "OSM2",
                    base: true
                }),
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "OSM3",
                    base: true
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([6.1319, 49.6116], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 13,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', '$compile', 'hs.map.service', '$timeout',
            function($scope, Core, $compile, hsmap, $timeout) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on("scope_loaded", function(event, args) {
                    if (args == 'Map') {

                    }

                    if (args == 'Sidebar') {
                        var el = angular.element('<div id="test3" hs.pilsentraffic.directive ng-controller="hs.pilsentraffic.controller" ng-if="Core.exists(\'hs.pilsentraffic.controller\')" ng-show="Core.panelVisible(\'pilsentraffic\', this)"></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);                        

                        var toolbar_button = angular.element('<div hs.pilsentraffic.toolbar_button_directive></div>');
                        angular.element('.sidebar-list').append(toolbar_button);
                        $compile(toolbar_button)(event.targetScope);

                        Core.setMainPanel('pilsentraffic');
                    }
                });

                $scope.$on('layermanager.updated', function(data, layer) {
                    if (layer.get('base') == true) {
                        //Grayscale map
                        layer.on('postcompose', function(event) {
                            var context = event.context;
                            var canvas = context.canvas;
                            var image = context.getImageData(0, 0, canvas.width, canvas.height);
                            var data = image.data;
                            for (var i = 0, ii = data.length; i < ii; i += 4) {
                                data[i] = data[i + 1] = data[i + 2] = (3 * data[i] + 4 * data[i + 1] + data[i + 2]) / 8;
                            }
                            context.putImageData(image, 0, 0);
                        });
                    }
                });

                function addTopbar() {
                    var el = angular.element('<div hs.topmenu></div>');
                    angular.element(".gui-overlay").append(el);
                    $compile(el)($scope);
                }
                
                angular.element(document).ready(function () {
                    addTopbar();
                });
                
                
                $scope.showDeveloperInfo = function() {
                    $("#hs-dialog-area #advanced-info-dialog").remove();
                    var el = angular.element('<div hs.advanced_infopanel_directive></div>');
                    $("#hs-dialog-area").append(el)
                    $compile(el)($scope);
                    
                    $timeout(function () {
                        $scope.timeline.setData(data);
                        $scope.timeline.goTo(1);
                    }, 200);
                }

                    var data = {
                        'title': {
                            'media': {
                                'url': 'images/input.png',
                                'caption': 'From punch cards to multi touch.',
                                'credit': 'Arjuna Soriano'
                            },
                            'text': {
                                'headline': 'Revolutionary User Interfaces',
                                'text': '<p>The human computer interface helps to define computing at any one time. As computers have become more mainstream the interfaces have become more intimate. This is the journey of computer technology and how it has come to touch all of our lives.</p>'
                            }
                        },
                        'events': [{
                            'media': {
                                'url': 'https://youtu.be/DiQSHiAYt98',
                                'caption': '',
                                'credit': '<a href=\'http://www.nature.com/nature/videoarchive/index.html\'>Nature Video Channel</a>'
                            },
                            'start_date': {
                                'year': '1600',
                                'month': '1',
                                'day': '1'
                            },
                            'text': {
                                'headline': 'The Antikythera',
                                'text': 'In the year 1900, sponge divers discovered the Antikythera Mechanism, a remarkable mechanical computer used to track the cycles of the solar system dated to as early as 89 B.C. There was no input however. All computations were carried out by the intricate system of clockwork like plates and wheels..'
                            },
                            group: 'demo-group1'
                        }, {
                            'test': 'a text received from server',
                            'videoUrl': 'http://www.w3schools.com/html/mov_bbb.mp4',
                            'media': {
                                'url': '<demo video-url="data.videoUrl"></demo>',
                                'caption': '<span>{{model.test}}</span>'
                            },
                            'start_date': {
                                'year': '1610',
                                'month': '2',
                                'day': '1'
                            },
                            'end_date': {
                                'year': '1630',
                                'month': '2',
                                'day': '1'
                            },
                            'text': {
                                'headline': 'DEMO: {{data.test}}',
                                'text': 'This is the demo text with a link to angular data (<a ng-href="{{data.videoUrl}}">source</a>)'
                            },
                            group: 'demo-group2'
                        }, {
                            'media': {
                                'url': 'images/input.png',
                                'caption': 'This piece is on display at Mus\u00e9e des Arts et M\u00e9tiers, Paris.',
                                'credit': '\u00a9 2005 <a href=\'http://commons.wikimedia.org/wiki/User:David.Monniaux\'>David Monniaux</a>  '
                            },
                            'start_date': {
                                'year': '1642'
                            },
                            'text': {
                                'headline': 'Pascal\'s Calculator',
                                'text': '<p>Blaise Pascal invented this calculator to help his father reorganize the French tax system. It could add and subtract in one step and multiply and divide by repetition.</p><p>Input was achieved by spinning the little wheels: inspiration for the iPod click wheel?</p>'
                            },
                            group: 'demo-group1'
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/5/59/Arithmometre.jpg',
                                'caption': '',
                                'credit': 'By <a href=\'http://commons.wikimedia.org/wiki/File%3AArithmometre.jpg\'>Ezrdr</a>, via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1820',
                                'month': '3',
                                'day': '1'
                            },
                            'text': {
                                'headline': 'Thomas Arithometer',
                                'text': 'This is the first mass-produced calculator that could add, subtract, multiply and divide. Numbers were  input with all of the little knobs and dials and then the handle was twisted to perform the calculation.'
                            },
                            group: 'demo-group1'
                        }, {
                            'media': {
                                'url': 'https://youtu.be/2ypE4ZJF7qY',
                                'caption': 'The Jacquard loom is still in use today in modern factories. The punch-cards can be clearly seen being pulled to the top of the loom.',
                                'credit': '<a href=\'http://www.youtube.com/user/FiberMusings\'>FiberMusings</a>'
                            },
                            'start_date': {
                                'year': '1801',
                                'month': '4',
                                'day': '1'
                            },
                            'text': {
                                'headline': 'Jacquard Loom',
                                'text': 'A loom is not a computer. It is the first machine however to use punch-cards as a means of input into a machine. By changing the arrangement of the holes in the card, the loom would weave different patterns. '
                            },
                            group: 'demo-group3'
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/a/a4/Analytical_Engine_%282290032530%29.jpg',
                                'caption': 'This modern model of the Analytical Engine is housed at the Science Museum in London.',
                                'credit': 'By <a href=\'http://commons.wikimedia.org/wiki/File%3AAnalytical_Engine_(2290032530).jpg\'>Marcin Wichary</a> via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1833'
                            },
                            'text': {
                                'headline': 'The Analytical Engine',
                                'text': 'Charles Babbage designed but was never able to produce a working model but it is significant in that it relied upon punched cards for data and programs and would employ a language similar to modern assembly language complete with loops and conditional branching (for the nerds out there).'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/9/9a/Sholes_typewriter.jpg',
                                'caption': 'A prototype of the typewriter with the QWERTY layout clearly visible.',
                                'credit': 'By George Iles, via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1868'
                            },
                            'text': {
                                'headline': 'The Typewriter',
                                'text': 'Again, not a computer but an important step forward in user interfaces. Invented by Christopher Sholes, An American engineer, the typewriter was layed out in the familiar QWERTY style.'
                            }
                        }, {
                            'media': {
                                'url': 'https://youtu.be/UZVEp78b0XI?t=1m54s',
                                'caption': 'A history of early IBM punch card machines and featuring a Pascal calculator.',
                                'credit': '<a href=\'http://www.youtube.com/user/clipcafe\'>clipcafe</a>'
                            },
                            'start_date': {
                                'year': '1890'
                            },
                            'text': {
                                'headline': 'Herman Hollerith',
                                'text': 'In 1890, Hollerith introduced his tabulating machine to be used in the census. He also later invented a key punch, a machine that punched the holes into cards operated by a keyboard. His company was one of the companies that later merged to form IBM.'
                            }
                        }, {
                            'media': {
                                'url': '',
                                'caption': '',
                                'credit': ''
                            },
                            'start_date': {
                                'year': '1940'
                            },
                            'text': {
                                'headline': 'Remote Access Computing',
                                'text': 'George Stibitz demonstrated the Complex Number Calculator (CNC) at Dartmouth College. The astonishing part was that the CNC was in New York City.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/1/16/Classic_shot_of_the_ENIAC.jpg',
                                'caption': '\'Cpl. Irwin Goldstein (foreground) sets the switches on one of the ENIAC\'s function tables at the Moore School of Electrical Engineering.\' (Caption via Wikimedia)',
                                'credit': 'U.S. Army photo'
                            },
                            'start_date': {
                                'year': '1946'
                            },
                            'text': {
                                'headline': 'ENIAC',
                                'text': 'Weighing 30 tons, and containing over 18,000 vacuum tubes, the ENIAC was the first truly modern computer. It could be programmed for many complex programs and used an early keyboard as its input.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/5/55/Museum_of_Science%2C_Boston%2C_MA_-_IMG_3163.JPG',
                                'caption': 'Input for the UNIVAC I was via keyboard in this massive input console.',
                                'credit': 'By Daderot (Own work) [Public domain], via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1951'
                            },
                            'text': {
                                'headline': 'UNIVAC I',
                                'text': 'The Universal Automatic Computer I weighed in at 13 tons and sold for over one million dollars. It was the first mass produced computer, selling 46 units. The massive cockpit of a console featured a keyboard'
                            }
                        }, {
                            'media': {
                                'url': '',
                                'caption': '',
                                'credit': ''
                            },
                            'start_date': {
                                'year': '1964'
                            },
                            'text': {
                                'headline': 'Multics',
                                'text': 'A collaboration between MIT, Bell Laboratories and General Electric created the Multics system. It was a multi-user, time sharing system that spurred along the use of a new interface, a monitor.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/7/7f/Data_General_Nova_SN_1.agr.JPG',
                                'caption': 'The first Data General Nova minicomputer displayed at the Computer History Museum in Silicon Valley.',
                                'credit': 'By Arnold Reinhold, via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1968'
                            },
                            'text': {
                                'headline': 'Minicomputer',
                                'text': 'Data General introduces the Nova Minicomputer which served as an inspiration for Steve Wozniak\'s design of the Apple I.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/f/f0/SRI_Douglas_Engelbart_2008.jpg',
                                'caption': 'Douglas Engelbart with the first computer mouse prototype.',
                                'credit': 'By SRI International, via Wikimedia Commons'
                            },
                            'start_date': {
                                'month': '12',
                                'day': '9',
                                'year': '1968'
                            },
                            'text': {
                                'headline': 'The Mouse',
                                'text': 'Douglas C. Engelbart and his team demonstrated an online system featuring a mouse, hypertext and the first graphical user interface, a \'windows\' system. The mouse was encased in a wood body and had only one button.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/5/5e/Xerox_Alto_mit_Rechner.JPG',
                                'caption': '',
                                'credit': 'By Joho345, via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1974'
                            },
                            'text': {
                                'headline': 'Xerox Alto',
                                'text': 'The Xerox Alto was the first workstation with a built in mouse with three buttons.'
                            }
                        }, {
                            'media': {
                                'url': '//www.flickr.com/photos/euthman/281712899/',
                                'caption': 'An Apple I computer on display at the Smithsonian.',
                                'credit': '<a href=\'http://www.flickr.com/photos/euthman/281712899/\'>Ed Uthman</a> via Flickr'
                            },
                            'start_date': {
                                'year': '1976'
                            },
                            'text': {
                                'headline': 'Apple I',
                                'text': 'Steve Wozniak designed the Apple I, a single-board computer that he and Steve Jobs sold for $500 each. Thus began Apple Inc. and the Personal Computer.'
                            }
                        }, {
                            'media': {
                                'url': '//www.flickr.com/photos/mightyohm/5333827381/',
                                'caption': 'An Apple I computer on display at the Smithsonian.',
                                'credit': '<a href=\'http://www.flickr.com/photos/mightyohm/5333827381/\' > Jeff Keyzer < / a > via Flickr'
                            },
                            'start_date': {
                                'year': '1976'
                            },
                            'text': {
                                'headline': 'The Osborne I',
                                'text': 'Weighing 24 pounds and costing under $2,000, the Osborne I was the first portable computer, although you probably couldn\'t use it in your lap for too long.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/a/a9/Microsoft_Windows_1.0_page1.jpg',
                                'caption': '',
                                'credit': 'By Microsoft, via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1982'
                            },
                            'text': {
                                'headline': 'Windows 1.0',
                                'text': 'Microsoft unveils what will become the dominant operating system for the next several decades.'
                            }
                        }, {
                            'media': {
                                'url': '//www.flickr.com/photos/mwichary/2179402603/',
                                'caption': 'The Original Macintosh with extra external floppy drive.',
                                'credit': '<a href=\'http://www.flickr.com/photos/mwichary/2179402603/\'>Marcin Wichary</a> via Flickr'
                            },
                            'start_date': {
                                'year': '1984'
                            },
                            'text': {
                                'headline': 'The Macintosh',
                                'text': 'Apple introduced the Macintosh which was the first commercially successful computer with a mouse and a Graphical User Interface.'
                            }
                        }, {
                            'media': {
                                'url': '/static/img/examples/user-interface/palm.png',
                                'caption': 'A Palm Pilot.',
                                'credit': '<a href=\'http://en.wikipedia.org/wiki/File:Palmpilot5000_eu.png\'>Channel R</a> via Wikimedia Commons'
                            },
                            'start_date': {
                                'year': '1997'
                            },
                            'text': {
                                'headline': 'The Stylus',
                                'text': 'Personal digital assistants introduce the touch screen with the use of a stylus. Handwriting recognition was hit or miss but some companies developed simplified alphabet input strokes to improve recognition.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/3/35/Ipod_1G.png',
                                'caption': 'The Original iPod with click wheel user interface.',
                                'credit': 'By Rjcflyer@aol.com at en.wikipedia via Wikimedia Commons'
                            },
                            'start_date': {
                                'month': '10',
                                'day': '23',
                                'year': '2001'
                            },
                            'text': {
                                'headline': 'Continuous Scrolling',
                                'text': 'The first iPod introduces the wheel as a user interface. It allowed users to continuously scroll through thousands of songs seemlessly. This interface helped Apple dominate the music player business and eventually the music content business through its iTunes ecosystem.'
                            }
                        }, {
                            'media': {
                                'url': '//upload.wikimedia.org/wikipedia/commons/4/49/IPhone_at_Macworld_%28angled_view%29.jpg',
                                'caption': '',
                                'credit': 'By blakeburris, via <a href=\'http://commons.wikimedia.org/wiki/File:IPhone_at_Macworld_(angled_view).jpg\'>Wikimedia Commons</a>'
                            },
                            'start_date': {
                                'year': '2007'
                            },
                            'text': {
                                'headline': 'Multi Touch',
                                'text': 'Steve Jobs unveils the iPhone and the multi touch interface.'
                            }
                        }, {
                            'media': {
                                'url': '/static/img/examples/user-interface/4s.jpg',
                                'caption': '',
                                'credit': 'Apple Inc.'
                            },
                            'start_date': {
                                'year': '2012'
                            },
                            'text': {
                                'headline': 'Speech Recognition',
                                'text': '<p>Speech recognition has been tested and improved upon for years in military cockpits in the U.S. France and U.K. In fact, Siri, the speech recognition engine used in the iPhone 4S was developed first by DARPA, the Defense Advanced Research Projects Agency.</p>'
                            }
                        }]
                    };
                    
                $scope.options = {
                    debug: true,
                    timenav_position: 'top',
                    language: 'en',
                    data: data
                };

                $scope.$on('layermanager.layer_time_changed', function(evt, layer, d) {
                    angular.forEach(hsmap.map.getLayers(), function(other_layer) {
                        if (other_layer.getSource().updateParams)
                            other_layer.getSource().updateParams({
                                'TIME': d
                            });
                    })
                });



                Core.panelEnabled('compositions', false);
                Core.panelEnabled('status_creator', false);
                Core.panelEnabled('permalink', false);
                Core.panelEnabled('layermanager', false);

                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
