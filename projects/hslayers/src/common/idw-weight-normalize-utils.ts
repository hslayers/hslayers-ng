import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

export function normalizeWeight(
  features: Feature<Geometry>[],
  weight: string
): void {
  //https://www.statology.org/normalize-data-between-0-and-100/
  const weightValues = features.map((f) => parseInt(f.get(weight)));
  const min = Math.min(...weightValues);
  const max = Math.max(...weightValues);
  features.forEach((f) => {
    const normalizedWeight = Math.ceil(
      ((f.get(weight) - min) / (max - min)) * 100
    );
    f.set(weight, normalizedWeight);
  });
}
