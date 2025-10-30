import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';

/**
 * Registers HSLayers projection definitions in proj4 and wires them to OpenLayers.
 * Includes GML URL aliases for interoperability.
 */
export function registerHslayersProj4Defs(): void {
  // ETRS89 / LAEA Europe
  proj4.defs(
    'EPSG:3035',
    '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs +axis=neu',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#3035',
    proj4.defs('EPSG:3035'),
  );

  // S-JTSK / Krovak East North
  proj4.defs(
    'EPSG:5514',
    '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=542.5,89.2,456.9,5.517,2.275,5.516,6.96 +units=m +no_defs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#5514',
    proj4.defs('EPSG:5514'),
  );

  // ETRS89
  proj4.defs(
    'EPSG:4258',
    '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#4258',
    proj4.defs('EPSG:4258'),
  );

  // UTM zones
  proj4.defs(
    'EPSG:32633',
    '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#32633',
    proj4.defs('EPSG:32633'),
  );
  proj4.defs(
    'EPSG:32634',
    '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs +type=crs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#32634',
    proj4.defs('EPSG:32634'),
  );
  proj4.defs(
    'EPSG:32718',
    '+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs +type=crs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#32718',
    proj4.defs('EPSG:32718'),
  );

  // Polar Stereographic
  proj4.defs(
    'EPSG:3995',
    '+proj=stere +lat_0=90 +lat_ts=71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#3995',
    proj4.defs('EPSG:3995'),
  );
  proj4.defs(
    'EPSG:3031',
    '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#3031',
    proj4.defs('EPSG:3031'),
  );

  // Equidistant Cylindrical
  proj4.defs(
    'EPSG:4087',
    '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#4087',
    proj4.defs('EPSG:4087'),
  );

  // ETRS89 / LCC Europe
  proj4.defs(
    'EPSG:3034',
    '+proj=lcc +lat_1=35 +lat_2=65 +lat_0=52 +lon_0=10 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +units=m +no_defs +type=crs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#3034',
    proj4.defs('EPSG:3034'),
  );

  // LKS-92 / Latvia TM
  proj4.defs(
    'EPSG:3059',
    '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=-6000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#3059',
    proj4.defs('EPSG:3059'),
  );

  // MAGNA-SIRGAS / Origen-Nacional (Colombia)
  proj4.defs(
    'EPSG:9377',
    '+proj=tmerc +lat_0=4 +lon_0=-73 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#9377',
    proj4.defs('EPSG:9377'),
  );

  register(proj4);
}
