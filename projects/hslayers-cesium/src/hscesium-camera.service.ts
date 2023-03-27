import {Injectable} from '@angular/core';

import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Ellipsoid,
  PerspectiveFrustum,
  Rectangle,
  SceneMode,
  Viewer,
} from 'cesium';
import {HsCesiumConfig} from './hscesium-config.service';
import {HsConfig, HsMapService} from 'hslayers-ng';
import {get as getProj, transformExtent} from 'ol/proj';

export class CesiumCameraServiceParams {
  viewer: Viewer;
  lastGoodCenter: any[] = null;
  ellipsoid: any;
  lastSyncedExtentFromOl: any;
}
@Injectable({
  providedIn: 'root',
})
export class HsCesiumCameraService extends CesiumCameraServiceParams {
  constructor(
    public HsMapService: HsMapService,
    public hsConfig: HsConfig,
    private hsCesiumConfig: HsCesiumConfig
  ) {
    super();
    this.hsCesiumConfig.viewerLoaded.subscribe((viewer) => {
      this.viewer = viewer;
      this.fixMorphs(this.viewer);
    });
  }

  /**
   * @param distance -
   * @param latitude -
   * Calculates the resolution for a given distance from the ground and latitude
   */
  calcResolutionForDistance(distance, latitude) {
    // See the reverse calculation (calcDistanceForResolution_) for details
    const canvas = this.viewer.scene.canvas;
    const fov = (<PerspectiveFrustum>this.viewer.camera.frustum).fov;
    const metersPerUnit = getProj('EPSG:3857').getMetersPerUnit();

    const visibleMeters = 2 * distance * Math.tan(fov / 2);
    const relativeCircumference = Math.cos(Math.abs(latitude));
    const visibleMapUnits =
      visibleMeters / metersPerUnit / relativeCircumference;
    const resolution = visibleMapUnits / canvas.clientHeight;
    return resolution;
  }

  /**
   * Gets the position the camera is pointing to in lon/lat coordinates and resolution as the third array element
   */
  getCameraCenterInLngLat() {
    if (
      this.viewer.scene.mode == SceneMode.SCENE2D ||
      this.viewer.scene.mode == SceneMode.COLUMBUS_VIEW
    ) {
      const lngDeg =
        this.viewer.camera.positionCartographic.longitude * (180 / Math.PI);
      const latDeg =
        this.viewer.camera.positionCartographic.latitude * (180 / Math.PI);
      const position = [lngDeg, latDeg, 0];
      return position;
    } else if (this.viewer.scene.mode == SceneMode.SCENE3D) {
      const ray = this.viewer.camera.getPickRay(
        new Cartesian2(
          this.viewer.canvas.width / 2,
          this.viewer.canvas.height / 2
        )
      );
      const positionCartesian3 = this.viewer.scene.globe.pick(
        ray,
        this.viewer.scene
      );
      if (positionCartesian3) {
        const positionCartographic =
          Cartographic.fromCartesian(positionCartesian3);
        const lngDeg = CesiumMath.toDegrees(positionCartographic.longitude);
        const latDeg = CesiumMath.toDegrees(positionCartographic.latitude);
        const position = [
          lngDeg,
          latDeg,
          this.calcResolutionForDistance(
            Cartographic.fromCartesian(this.viewer.camera.position).height -
              positionCartographic.height,
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
   * Gets the position the camera is pointing to in cartesian coordinates and resolution as the third array element
   */
  getCameraCenterInCartesian() {
    const ray = this.viewer.camera.getPickRay(
      new Cartesian2(
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
     * @param d -
     */
    function cornerToDegrees(d) {
      try {
        return [
          CesiumMath.toDegrees(
            this.viewer.scene.globe.ellipsoid.cartesianToCartographic(d)
              .longitude
          ),
          CesiumMath.toDegrees(
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
      CesiumMath.toDegrees(
        this.viewer.scene.globe.ellipsoid.cartesianToCartographic(
          this.viewer.camera.position
        ).longitude
      ),
      CesiumMath.toDegrees(
        this.viewer.scene.globe.ellipsoid.cartesianToCartographic(
          this.viewer.camera.position
        ).latitude
      ),
    ];
    let top_left = cornerToDegrees(
      this.getCornerCoord(
        new Cartesian2(of_x, of_y),
        new Cartesian2(this.viewer.canvas.width, this.viewer.canvas.height)
      )
    );
    let top_right = cornerToDegrees(
      this.getCornerCoord(
        new Cartesian2(this.viewer.canvas.width - of_x, of_y),
        new Cartesian2(0, this.viewer.canvas.height)
      )
    );
    let bot_left = cornerToDegrees(
      this.getCornerCoord(
        new Cartesian2(
          this.viewer.canvas.width - of_x + 100,
          this.viewer.canvas.height - of_y + 100
        ),
        new Cartesian2(0, 0)
      )
    );
    let bot_right = cornerToDegrees(
      this.getCornerCoord(
        new Cartesian2(-100 + of_x, this.viewer.canvas.height - of_y + 100),
        new Cartesian2(this.viewer.canvas.width, 0)
      )
    );

    /**
     * @param p -
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
      new Cartesian2(x1, y1),
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
        new Cartesian2(x1, y1),
        this.ellipsoid
      );
      if (coordinate) {
        return coordinate;
      }
    }
    return;
  }

  setExtentEqualToOlExtent(view) {
    try {
      const ol_ext = view.calculateExtent(this.HsMapService.getMap().getSize());
      const trans_ext = transformExtent(
        ol_ext,
        view.getProjection(),
        'EPSG:4326'
      );
      this.lastSyncedExtentFromOl = trans_ext;
      if (this.viewer.isDestroyed()) {
        return;
      }
      this.fitExtent(trans_ext);
    } catch (ex) {
      console.error(ex);
    }
  }

  private fitExtent(trans_ext: any) {
    this.viewer.camera.setView({
      destination: Rectangle.fromDegrees(
        trans_ext[0],
        trans_ext[1],
        trans_ext[2],
        trans_ext[3]
      ),
    });

    const width =
      this.viewer.canvas.width > 0
        ? this.viewer.canvas.width
        : window.innerWidth;
    const height =
      this.viewer.canvas.height > 0
        ? this.viewer.canvas.height
        : window.innerHeight;
    const ray = this.viewer.camera.getPickRay(
      new Cartesian2(width / 2, height / 2)
    );
    const positionCartesian3 = this.viewer.scene.globe.pick(
      ray,
      this.viewer.scene
    );
    if (positionCartesian3) {
      /*
            var instance = new Cesium.GeometryInstance({
                geometry : new RectangleGeometry({
                    rectangle : Rectangle.fromDegrees(trans_ext[0], trans_ext[1], trans_ext[2], trans_ext[3]),
                    height: Ellipsoid.WGS84.cartesianToCartographic(positionCartesian3).height,
                    vertexFormat : EllipsoidSurfaceAppearance.VERTEX_FORMAT
                })
            });
 
            this.viewer.scene.primitives.removeAll();
            this.viewer.scene.primitives.add(new Cesium.Primitive({
                geometryInstances : instance,
                appearance : new EllipsoidSurfaceAppearance({aboveGround: true})
            })); */
      this.viewer.camera.moveBackward(
        Ellipsoid.WGS84.cartesianToCartographic(positionCartesian3).height
      );
    }
  }

  /**
   * @param resolution -
   * @param latitude -
   * @deprecated
   * Calculates the distance from the ground based on resolution and latitude
   */
  calcDistanceForResolution(resolution, latitude) {
    const canvas = this.viewer.scene.canvas;
    const fov = (<PerspectiveFrustum>this.viewer.camera.frustum).fov;
    const metersPerUnit = this.HsMapService.getMap()
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
    const requiredDistance = visibleMeters / 2 / Math.tan(fov / 2);

    // NOTE: This calculation is not absolutely precise, because metersPerUnit
    // is a great simplification. It does not take ellipsoid/terrain into account.

    return requiredDistance;
  }

  fixMorphs(viewer) {
    viewer.camera.moveEnd.addEventListener((e) => {
      if (!this.HsMapService.visible) {
        const center = this.getCameraCenterInLngLat();
        if (center === null || center[0] == 0 || center[1] == 0) {
          return;
        } //Not looking on the map but in the sky
        this.lastGoodCenter = center;
      }
    });
    viewer.scene.morphComplete.addEventListener(() => {
      if (this.lastGoodCenter) {
        setTimeout(() => {
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
              this.lastGoodCenter[0],
              this.lastGoodCenter[1],
              15000.0
            ),
            duration: 1,
          });
        }, 1000);
      }
    });
  }

  getDefaultViewport() {
    let trans_ext;
    if (this.lastSyncedExtentFromOl) {
      trans_ext = this.lastSyncedExtentFromOl;
    } else if (this.hsConfig.default_view) {
      const view = this.hsConfig.default_view;
      let winWidth = window.innerWidth;
      let winHeight = window.innerHeight;
      if (innerWidth == 0) {
        winWidth = 1900;
      }
      if (winHeight == 0) {
        winHeight = 1080;
      }
      const ol_ext = view.calculateExtent([winWidth, winHeight]);
      trans_ext = transformExtent(ol_ext, view.getProjection(), 'EPSG:4326');
    }
    const tmp = {rectangle: undefined, viewFactor: 0};
    if (trans_ext && !isNaN(trans_ext[0])) {
      const rectangle = Rectangle.fromDegrees(
        trans_ext[0],
        trans_ext[1],
        trans_ext[2],
        trans_ext[3]
      );
      tmp.rectangle = rectangle;
    }
    return tmp;
  }
}
