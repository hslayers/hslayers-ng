import {Pipe, PipeTransform} from '@angular/core';
const featureLimit = 20;

@Pipe({name: 'featureFilter'})
export class HsFeatureFilterPipe implements PipeTransform {
  /**
   * Transform
   *
   * @param {any[]} features
   * @param {string} searchText
   * @returns {any[]}
   */
  transform(features: any[], searchText: string): any[] {
    if (!features) {
      return [];
    }
    if (!searchText) {
      return features;
    }
    searchText = searchText.toLocaleLowerCase();

    return features
      .filter((feature) => {
        return feature.name.toLocaleLowerCase().includes(searchText);
      })
      .slice(0, featureLimit);
  }
}
