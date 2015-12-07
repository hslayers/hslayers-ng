function mapConf(map, ol) {




    var featureOverlay = new ol.FeatureOverlay({
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });
    featureOverlay.setMap(map);




    var modify = new ol.interaction.Modify({
        features: featureOverlay.getFeatures(),

        // the SHIFT key must be pressed to delete vertices, so
        // that new vertices can be drawn at the same position
        // of existing vertices
        deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(event) &&
                ol.events.condition.singleClick(event);
        }

    });


    featureOverlay.getFeatures()


    map.addInteraction(modify);


    var draw; // global so we can remove it lat	 console.log(this);er
    function addInteraction() {
        draw = new ol.interaction.Draw({
            features: featureOverlay.getFeatures(),
            type: "Polygon"
        });

        draw.on("drawstart", function(e) {
            e.feature.on('change', function(ff) {
                var res = [];
                var features = ff.target.getGeometry().getCoordinates();
                //for (var i = 0; i < features.length; i++) {
                for (var j = 0; j < features[0].length; j++) {
                    var pp = transform(features[0][j]);
                    res.push(pp);
                }
                //console.log("feature num "+features.length);

                try {
                    var polygons = [];
                    var polid = 0;
                    var ts = new poly2tri.SweepContext(res);
                    ts.triangulate();
                    polygons[polid++] = trianglesToArray(ts.getTriangles());
                    polygons.length = Object.keys(polygons).length;
                    WGL.filterDim('themap','polybrush',polygons);
                } catch (e) {
                    console.log(e);
                }

            }, draw);
        });

        map.addInteraction(draw);
    }



    addInteraction();



    function transform(p) {
        var tl = getTopLeftTC();

        var v = map.getPixelFromCoordinate(p);
        console.log(v);
        var prop = map.getProperties()
            // var v = map.getViewPortPxFromLonLat( new OpenLayers.LonLat(90,0));
        var v0 = toLevel0(v, tl, prop.view.getZoom());
        return v0;

    }

    function toLevel0(pt, tl, zoom) {
        var p = [];
        var ts = 256;
        var scale = Math.pow(2, zoom);
        p.x = pt[0] / scale + tl.x;
        p.y = pt[1] / scale + tl.y;
        return p;
    }
    var tlwgs = [-20037508.34, 20037508.34];

    function getTopLeftTC() {

        var s = Math.pow(2, map.getView().getZoom());
        var tlpixel = map.getPixelFromCoordinate(tlwgs);
        var res = {
            x: -tlpixel[0] / s,
            y: -tlpixel[1] / s
        }
        return res
    }

    function trianglesToArray(trig) {
        var points = [];
        for (var i in trig) {
            for (var j in trig[i].points_) {
                points.push(trig[i].points_[j].x);
                points.push(trig[i].points_[j].y);
            }
        }
        return points;

    }
}
