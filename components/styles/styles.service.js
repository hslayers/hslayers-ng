import {Style, Icon, Stroke, Fill, Circle} from 'ol/style';

export default ['$http', 'config',
        function ($http, config) {
            this.pin_white_blue = new Style({
                image: new Icon({
                    src: require('img/pin_white_blue32.png'),
                    crossOrigin: 'anonymous',
                    anchor: [0.5, 1]
                })
            });

            this.pin_white_blue_highlight = function (feature, resolution) {
                return [new Style({
                    image: new Icon({
                        src: feature.get('highlighted') ? require('img/pin_white_red32.png') : require('img/pin_white_blue32.png'),
                        crossOrigin: 'anonymous',
                        anchor: [0.5, 1]
                    })
                })]
            };

            this.measure_style = new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 1)'
                }),
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new Circle({
                    radius: 7,
                    fill: new Fill({
                        color: '#ffcc33'
                    })
                })
            });
            this.simple_style = new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 1)'
                }),
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 1
                }),
                image: new Circle({
                    radius: 7,
                    fill: new Fill({
                        color: '#ffcc33'
                    })
                })
            });
            var me = this;
        }
    ]