function mapConf(map, ol) {
    usercontrols = [];
    WGL.the_map = map;

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

    // select interaction working on "click"
    var selectClick = new ol.interaction.Select({
        condition: ol.events.condition.click,
        features: featureOverlay.getFeatures()
    });

    function deleteFeatures(e) {
        var f = selectClick.getFeatures();
        f.forEach(function(ff) {
            featureOverlay.removeFeature(ff);
            delete polygons[ff.wglId];
            //*deactivate filter*/
            var l = 0;
            for (var i in polygons) {
                if (typeof(polygons[i]) != 'undefined') {
                    l++;
                }
            }
            WGL.filterDim('themap', 'polybrush', polygons);

        })
        selectClick.getFeatures().clear();
    }

    selectClick.on('select', function(e) {
        deleteFeatures(e);
    })


    usercontrols['select'] = selectClick;

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
    featureOverlay.getFeatures();

    var draw; // global so we can remove it lat	 console.log(this);er

    draw = new ol.interaction.Draw({
        features: featureOverlay.getFeatures(),
        type: "Polygon"
    });

    var polygons = [];
    var polid = 0;

    draw.on("drawstart", function(e) {
        e.feature.on('change', function(ff) {
            var res = [];
            var features = ff.target.getGeometry().getCoordinates();
            if (typeof(ff.target.wglId) == 'undefined') {
                ff.target.wglId = polid++;
            }
            for (var j = 0; j < features[0].length; j++) {
                var pp = transform(features[0][j]);
                res.push(pp);
            }
            try {

                var ts = new poly2tri.SweepContext(res);
                ts.triangulate();
                polygons[ff.target.wglId] = trianglesToArray(ts.getTriangles());
                WGL.filterDim('themap', 'polybrush', polygons);
            } catch (e) {
                console.log(e);
            }

        }, draw);
    });

    usercontrols['draw'] = draw;

    function transform(p) {
        var tl = getTopLeftTC();

        var v = map.getPixelFromCoordinate(p);
        console.log(v);
        var prop = map.getProperties()
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

toggleControl = function(element) {
    for (key in usercontrols) {
        var control = usercontrols[key];

        if (element.value == key && element.checked) {
            WGL.the_map.addInteraction(control);
            console.log('activate ' + control);
        } else {
            WGL.the_map.removeInteraction(control);
            console.log('deactivate ' + control);
        }
    }
}
