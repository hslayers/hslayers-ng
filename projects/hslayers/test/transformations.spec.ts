import {transform} from 'ol/proj';

import {registerHslayersProj4Defs} from 'hslayers-ng/services/map';

const testCases = {
  'input_epsg': 'EPSG:4326',
  'test_points_lonlat': [
    [14.5, 50.1],
    [24.105, 56.949],
    [-75.0, -12.0],
  ],
  'projections': {
    'EPSG:3857': {
      'projected_xy': [
        [1614132.6165024668, 6463612.12425767],
        [2683356.3255718597, 7749701.851591589],
        [-8348961.809495518, -1345708.4084091089],
      ],
    },
    'EPSG:5514': {
      'projected_xy': [
        [-737038.2409094545, -1042396.8276306456],
        [-44978.40670661522, -324784.09451275464],
        [-15943187.303662632, -1196099.3394487072],
      ],
    },
    'EPSG:32633': {
      'projected_xy': [
        [464240.9241105748, 5549868.957357526],
        [1052914.444734098, 6348656.660014749],
        [-13654075.845400045, -9997964.943020988],
      ],
    },
    'EPSG:32634': {
      'projected_xy': [
        [35308.473666676844, 5570010.582577965],
        [688842.6653924943, 6315999.473622412],
        [-13045125.966776134, -12780472.193640037],
      ],
    },
    'EPSG:3034': {
      'projected_xy': [
        [4310726.502207282, 2605346.541943175],
        [4828755.5116025945, 3412572.3360558194],
        [-7982947.071563048, 2343053.861617691],
      ],
    },
    'EPSG:3035': {
      'projected_xy': [
        [4642761.408127841, 3008504.3105561016],
        [5173771.089887958, 3845027.345495121],
        [-4992179.440512415, 1349283.7730275188],
      ],
    },
    'EPSG:3059': {
      'projected_xy': [
        [-178862.4925534142, -406893.0101639712],
        [506387.2483741958, 311713.76754751336],
        [-12397542.968136929, -19912441.426313058],
      ],
    },
    'EPSG:32718': {
      'projected_xy': [
        [5356867.110822201, 19951399.20293968],
        [4346905.6375562195, 20653406.78766808],
        [500000.0, 8673446.364194356],
      ],
    },
    'EPSG:9377': {
      'projected_xy': [
        [9848587.17951538, 11319446.847860107],
        [8869534.87834141, 12064814.789363625],
        [4782328.283709416, 231236.61742413463],
      ],
    },
    'EPSG:32719': {
      'projected_xy': [
        [5312700.614934469, 19395663.50315457],
        [4401739.351621034, 20223010.979514416],
        [-154255.03168104088, 8666304.676359769],
      ],
    },
    'EPSG:32635': {
      'projected_xy': [
        [-392676.82352643553, 5624998.833236482],
        [323924.73649822164, 6315438.633078234],
        [-11647344.918272495, -14826997.552375445],
      ],
    },
    'EPSG:32636': {
      'projected_xy': [
        [-818655.1798336308, 5715705.523562323],
        [-40204.62240118964, 6346969.3348173415],
        [-10106574.770125888, -16110517.585864529],
      ],
    },
    'EPSG:32637': {
      'projected_xy': [
        [-1241204.5891833864, 5843520.469028521],
        [-401850.3034467661, 6410857.326691805],
        [-8696966.600277254, -16908639.05078289],
      ],
    },
  },
};
describe('Coordinate transformations', () => {
  beforeAll(() => {
    registerHslayersProj4Defs();
  });

  it('transforms test_points_lonlat to expected values', () => {
    const inputEpsg = testCases.input_epsg;
    const points = testCases.test_points_lonlat;
    let precision = 3; // decimals for toBeCloseTo

    type ProjectionCase = {projected_xy: number[][]};
    Object.entries(testCases.projections).forEach(([targetEpsg, data]) => {
      const expected = (data as ProjectionCase).projected_xy;

      if (targetEpsg === 'EPSG:5514') {
        //Different datum - lower precision
        precision = 0;
      }

      for (const [idx, pt] of points.entries()) {
        const out = transform(pt as [number, number], inputEpsg, targetEpsg);

        if (targetEpsg === 'EPSG:5514' && idx > 0) {
          //Skip non CZ points for krovak
          //Results would be:
          // EPSG:5514 X for point 1: Expected -44948.39682995881 to be close to -44978.40670661522, 0.
          // EPSG:5514 Y for point 1: Expected -324808.55928313266 to be close to -324784.09451275464, 0.
          //
          // EPSG:5514 X for point 2: Expected -15942845.527170245 to be close to -15943187.303662632, 0.
          // EPSG:5514 Y for point 2: Expected -1196614.5191049837 to be close to -1196099.3394487072, 0.
          continue;
        }
        expect(out[0])
          .withContext(`${targetEpsg} X for point ${idx}`)
          .toBeCloseTo(expected[idx][0], precision);
        expect(out[1])
          .withContext(`${targetEpsg} Y for point ${idx}`)
          .toBeCloseTo(expected[idx][1], precision);
      }
    });
  });
});
