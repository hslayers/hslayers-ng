import {get as getProj, transformExtent} from 'ol/proj';
import * as Cesium from 'cesium/Source/Cesium';

export class HsCesiumCameraService {
  constructor(HsMapService, $window) {
    'ngInject';
    this.HsMapService = HsMapService;
    this.$window = $window;
  }

  init(HsCesiumService) {
    this.viewer = HsCesiumService.viewer;
    this.fixMorphs(this.viewer);
  }

  /**
   * @param distance
   * @param latitude
   * @ngdoc method
   * @name HsCesiumService#calcResolutionForDistance
   * @private
   * @description Calculates the resolution for a given distance from the ground and latitude
   */
  calcResolutionForDistance(distance, latitude) {
    // See the reverse calculation (calcDistanceForResolution_) for details
    const canvas = this.viewer.scene.canvas;
    const fovy = this.viewer.camera.frustum.fovy;
    const metersPerUnit = getProj('EPSG:3857').getMetersPerUnit();

    const visibleMeters = 2 * distance * Math.tan(fovy / 2);
    const relativeCircumference = Math.cos(Math.abs(latitude));
    const visibleMapUnits =
      visibleMeters / metersPerUnit / relativeCircumference;
    const resolution = visibleMapUnits / canvas.clientHeight;
    return resolution;
  }

  /**
   * @ngdoc method
   * @name HsCesiumService#getCameraCenterInLngLat
   * @private
   * @description Gets the position the camera is pointing to in lon/lat coordinates and resolution as the third array element
   */
  getCameraCenterInLngLat() {
    if (
      this.viewer.scene.mode == Cesium.SceneMode.SCENE2D ||
      this.viewer.scene.mode == Cesium.SceneMode.COLUMBUS_VIEW
    ) {
      const lngDeg =
        this.viewer.camera.positionCartographic.longitude * (180 / Math.PI);
      const latDeg =
        this.viewer.camera.positionCartographic.latitude * (180 / Math.PI);
      const position = [lngDeg, latDeg, 0];
      return position;
    } else if (this.viewer.scene.mode == Cesium.SceneMode.SCENE3D) {
      const ray = this.viewer.camera.getPickRay(
        new Cesium.Cartesian2(
          this.viewer.canvas.width / 2,
          this.viewer.canvas.height / 2
        )
      );
      const positionCartesian3 = this.viewer.scene.globe.pick(
        ray,
        this.viewer.scene
      );
      if (positionCartesian3) {
        const positionCartographic = Cesium.Cartographic.fromCartesian(
          positionCartesian3
        );
        const lngDeg = Cesium.Math.toDegrees(positionCartographic.longitude);
        const latDeg = Cesium.Math.toDegrees(positionCartographic.latitude);
        const position = [
          lngDeg,
          latDeg,
          this.calcResolutionForDistance(
            Cesium.Cartographic.fromCartesian(this.viewer.camera.position)
              .height - positionCartographic.height,
            latDeg
          ),
        ];
        return position;
      } else {
        return null;
      }
    }
  }

  /**
   * @ngdoc method
   * @name HsCesiumService#getCameraCenterCartesian
   * @private
   * @description Gets the position the camera is pointing to in cartesian coordinates and resolution as the third array element
   */
  getCameraCenterInCartesian() {
    const ray = this.viewer.camera.getPickRay(
      new Cesium.Cartesian2(
        this.viewer.canvas.width / 2,
        this.viewer.canvas.height / 2
      )
    );
    const positionCartesian3 = this.viewer.scene.globe.pick(
      ray,
      this.viewer.scene
    );
    if (positionCartesian3) {
      return positionCartesian3;
    } else {
      return null;
    }
  }

  getViewportPolygon() {
    /**
     * @param d
     */
    function cornerToDegrees(d) {
      try {
        return [
          Cesium.Math.toDegrees(
            this.viewer.scene.globe.ellipsoid.cartesianToCartographic(d)
              .longitude
          ),
          Cesium.Math.toDegrees(
            this.viewer.scene.globe.ellipsoid.cartesianToCartographic(d)
              .latitude
          ),
        ];
      } catch (ex) {
        return [0, 0, 0, 0];
      }
    }
    const of_x = 0;
    const of_y = 0;
    const center = [
      Cesium.Math.toDegrees(
        this.viewer.scene.globe.ellipsoid.cartesianToCartographic(
          this.viewer.camera.position
        ).longitude
      ),
      Cesium.Math.toDegrees(
        this.viewer.scene.globe.ellipsoid.cartesianToCartographic(
          this.viewer.camera.position
        ).latitude
      ),
    ];
    let top_left = cornerToDegrees(
      this.getCornerCoord(
        new Cesium.Cartesian2(of_x, of_y),
        new Cesium.Cartesian2(
          this.viewer.canvas.width,
          this.viewer.canvas.height
        )
      )
    );
    let top_right = cornerToDegrees(
      this.getCornerCoord(
        new Cesium.Cartesian2(this.viewer.canvas.width - of_x, of_y),
        new Cesium.Cartesian2(0, this.viewer.canvas.height)
      )
    );
    let bot_left = cornerToDegrees(
      this.getCornerCoord(
        new Cesium.Cartesian2(
          this.viewer.canvas.width - of_x + 100,
          this.viewer.canvas.height - of_y + 100
        ),
        new Cesium.Cartesian2(0, 0)
      )
    );
    let bot_right = cornerToDegrees(
      this.getCornerCoord(
        new Cesium.Cartesian2(
          -100 + of_x,
          this.viewer.canvas.height - of_y + 100
        ),
        new Cesium.Cartesian2(this.viewer.canvas.width, 0)
      )
    );

    /**
     * @param p
     */
    function clamp(p) {
      const max_dist = 0.23;
      if (Math.abs(p[0] - center[0]) > max_dist) {
        p[0] =
          center[0] +
          (p[0] - center[0]) * (max_dist / Math.abs(p[0] - center[0]));
      }
      if (Math.abs(p[1] - center[1]) > max_dist) {
        p[1] =
          center[1] +
          (p[1] - center[1]) * (max_dist / Math.abs(p[1] - center[1]));
      }
      return p;
    }
    top_left = clamp(top_left);
    top_right = clamp(top_right);
    bot_left = clamp(bot_left);
    bot_right = clamp(bot_right);
    return [top_left, top_right, bot_left, bot_right];
  }

  getCornerCoord(startCoordinates, endCoordinates) {
    let coordinate = this.viewer.scene.camera.pickEllipsoid(
      startCoordinates,
      this.ellipsoid
    );

    // Translate coordinates
    let x1 = startCoordinates.x;
    let y1 = startCoordinates.y;
    const x2 = endCoordinates.x;
    const y2 = endCoordinates.y;
    // Define differences and error check
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    coordinate = this.viewer.scene.camera.pickEllipsoid(
      {
        x: x1,
        y: y1,
      },
      this.ellipsoid
    );
    if (coordinate) {
      return coordinate;
    }

    // Main loop
    while (!(x1 == x2 && y1 == y2)) {
      const e2 = err << 1;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }

      coordinate = this.viewer.scene.camera.pickEllipsoid(
        {
          x: x1,
          y: y1,
        },
        this.ellipsoid
      );
      if (coordinate) {
        return coordinate;
      }
    }
    return;
  }

  setExtentEqualToOlExtent(view) {
    if (this.viewer.isDestroyed()) {
      return;
    }
    const ol_ext = view.calculateExtent(this.HsMapService.map.getSize());
    const trans_ext = transformExtent(
      ol_ext,
      view.getProjection(),
      'EPSG:4326'
    );
    this.viewer.camera.setView({
      destination: Cesium.Rectangle.fromDegrees(
        trans_ext[0],
        trans_ext[1],
        trans_ext[2],
        trans_ext[3]
      ),
    });

    const ray = this.viewer.camera.getPickRay(
      new Cesium.Cartesian2(
        this.viewer.canvas.width / 2,
        this.viewer.canvas.height / 2
      )
    );
    const positionCartesian3 = this.viewer.scene.globe.pick(
      ray,
      this.viewer.scene
    );
    if (positionCartesian3) {
      /*
            var instance = new Cesium.GeometryInstance({
                geometry : new Cesium.RectangleGeometry({
                    rectangle : Cesium.Rectangle.fromDegrees(trans_ext[0], trans_ext[1], trans_ext[2], trans_ext[3]),
                    height: Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionCartesian3).height,
                    vertexFormat : Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
                })
            });

            this.viewer.scene.primitives.removeAll();
            this.viewer.scene.primitives.add(new Cesium.Primitive({
                geometryInstances : instance,
                appearance : new Cesium.EllipsoidSurfaceAppearance({aboveGround: true})
            })); */
      this.viewer.camera.moveBackward(
        Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionCartesian3)
          .height
      );
    }
  }

  /**
   * @param resolution
   * @param latitude
   * @ngdoc method
   * @name HsCesiumService#calcDistanceForResolution
   * @private
   * @deprecated
   * @description Calculates the distance from the ground based on resolution and latitude
   */
  calcDistanceForResolution(resolution, latitude) {
    const canvas = this.viewer.scene.canvas;
    const fovy = this.viewer.camera.frustum.fovy;
    const metersPerUnit = this.HsMapService.map
      .getView()
      .getProjection()
      .getMetersPerUnit();

    // number of "map units" visible in 2D (vertically)
    const visibleMapUnits = resolution * canvas.clientHeight;

    // The metersPerUnit does not take latitude into account, but it should
    // be lower with increasing latitude -- we have to compensate.
    // In 3D it is not possible to maintain the resolution at more than one point,
    // so it only makes sense to use the latitude of the "target" point.
    const relativeCircumference = Math.cos(Math.abs(latitude));

    // how many meters should be visible in 3D
    const visibleMeters =
      visibleMapUnits * metersPerUnit * relativeCircumference;

    // distance required to view the calculated length in meters
    //
    //  fovy/2
    //    |\
    //  x | \
    //    |--\
    // visibleMeters/2
    const requiredDistance = visibleMeters / 2 / Math.tan(fovy / 2);

    // NOTE: This calculation is not absolutely precise, because metersPerUnit
    // is a great simplification. It does not take ellipsoid/terrain into account.

    return requiredDistance;
  }

  fixMorphs(viewer) {
    const me = this;
    viewer.camera.moveEnd.addEventListener((e) => {
      if (!me.HsMapService.visible) {
        const center = me.getCameraCenterInLngLat();
        if (center === null || center[0] == 0 || center[1] == 0) {
          return;
        } //Not looking on the map but in the sky
        me.lastGoodCenter = center;
      }
    });
    viewer.scene.morphComplete.addEventListener(() => {
      if (me.lastGoodCenter) {
        // eslint-disable-next-line angular/timeout-service
        setTimeout(() => {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              me.lastGoodCenter[0],
              me.lastGoodCenter[1],
              15000.0
            ),
            duration: 1,
          });
        }, 1000);
      }
    });
  }

  setDefaultViewport() {
    const view = this.HsMapService.map.getView();
    let winWidth = this.$window.innerWidth;
    let winHeight = this.$window.innerHeight;
    if (innerWidth == 0) {
      winWidth = 1900;
    }
    if (winHeight == 0) {
      winHeight = 1080;
    }
    const ol_ext = view.calculateExtent([winWidth, winHeight]);
    const trans_ext = transformExtent(
      ol_ext,
      view.getProjection(),
      'EPSG:4326'
    );
    const rectangle = Cesium.Rectangle.fromDegrees(
      trans_ext[0],
      trans_ext[1],
      trans_ext[2],
      trans_ext[3]
    );
    if (trans_ext && !isNaN(trans_ext[0])) {
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;
    }
    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
  }
}
