import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {HsLayerDescriptor, WfsFeatureAttribute} from 'hslayers-ng/types';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {getWfsUrl} from 'hslayers-ng/common/extensions';

import {FilterType, LogicalOperatorType} from './filter.type';
@Injectable({
  providedIn: 'root',
})
export class HsFiltersService {
  http = inject(HttpClient);
  hsUtilsService = inject(HsUtilsService);

  selectedLayer: HsLayerDescriptor;

  attributesExcludedFromList: string[];
  layerAttributes: WfsFeatureAttribute[] = [];

  /**
   * Sets the selected layer for filtering operations
   * @param layer The layer to be set as selected
   */
  setSelectedLayer(layer: HsLayerDescriptor): void {
    this.selectedLayer = layer;
  }

  /**
   * Sets the attributes for the selected layer
   * @param attributes Array of WFS feature attributes
   */
  setLayerAttributes(attributes: WfsFeatureAttribute[]): void {
    this.layerAttributes = attributes;
  }

  /**
   * Adds a new filter to the collection based on the specified type
   * @param type The type of filter to add (AND, OR, COMPARE, NOT)
   * @param append Whether to append the new filter or replace existing ones
   * @param collection The collection to add the filter to
   */
  add(type: FilterType, append: boolean, collection: any[]): void {
    let filter;
    switch (type) {
      case 'AND':
        filter = [
          '&&',
          ['==', undefined, '<value>'],
          ['==', undefined, '<value>'],
        ];
        break;
      case 'OR':
        filter = [
          '||',
          ['==', undefined, '<value>'],
          ['==', undefined, '<value>'],
        ];
        break;
      case 'COMPARE':
        filter = ['==', undefined, '<value>'];
        break;
      case 'NOT':
        filter = ['!', ['==', undefined, '<value>']];
        break;
      default:
    }
    if (append) {
      collection.push(filter);
    } else {
      collection.length = 0;
      collection.push(...filter);
    }
  }

  /**
   * Converts logical operators to human-readable format
   * @param logOp The logical operator to convert
   * @returns The human-readable version of the operator
   */
  humanReadableLogOp(logOp: string): LogicalOperatorType {
    return {'&&': 'AND', '||': 'OR', '!': 'NOT'}[logOp] as LogicalOperatorType;
  }

  /**
   * Checks if the given filter is a logical operator
   * @param filters The filter array to check
   * @returns True if the filter is a logical operator, false otherwise
   */
  isLogOp(filters: any[]): boolean {
    return filters?.length > 0 && ['&&', '||', '!'].includes(filters[0]);
  }

  /**
   * Fetches attribute values for a given attribute name
   * @param attributeName The name of the attribute to fetch values for
   * @returns An Observable of the WfsFeatureAttribute with fetched values
   */
  getAttributeWithValues(
    attributeName: string,
  ): Observable<WfsFeatureAttribute> {
    const attribute = this.layerAttributes.find(
      (attr) => attr.name === attributeName,
    );
    if (!attribute) {
      return of(null);
    }

    if (attribute.values || attribute.range) {
      return of(attribute);
    }

    return this.fetchAttributeValues(attribute).pipe(
      map((updatedAttr) => {
        const index = this.layerAttributes.findIndex(
          (attr) => attr.name === attributeName,
        );
        this.layerAttributes[index] = updatedAttr;
        return updatedAttr;
      }),
      catchError(() => of(attribute)),
    );
  }

  /**
   * Fetches attribute values from the WFS service
   * @param attribute The attribute to fetch values for
   * @returns An Observable of the updated WfsFeatureAttribute
   */
  private fetchAttributeValues(
    attribute: WfsFeatureAttribute,
  ): Observable<WfsFeatureAttribute> {
    if (!this.selectedLayer?.layer) {
      return of(attribute);
    }

    const url = this.buildWfsUrl(this.selectedLayer.layer, attribute.name);

    return this.http.get(url, {observe: 'response', responseType: 'text'}).pipe(
      map((response) => {
        const contentType = response.headers.get('content-type');
        let parsedResponse: any;

        /**
         * NOTE: Spec says it might be served in other formats other than GML but
         * havent found any example so keeping just in case
         */
        if (contentType && contentType.includes('application/json')) {
          parsedResponse = JSON.parse(response.body);
        } else {
          // Assume XML if not JSON
          parsedResponse = response.body;
        }

        const values = this.extractValuesFromResponse(
          parsedResponse,
          attribute,
        );
        if (attribute.isNumeric) {
          return {
            ...attribute,
            range: {
              min: Math.min(...values),
              max: Math.max(...values),
            },
          };
        } else {
          return {
            ...attribute,
            values,
          };
        }
      }),
      catchError(() => of(attribute)),
    );
  }

  /**
   * Builds the WFS URL for fetching attribute values
   * @param layer The layer to build the URL for
   * @param attributeName The name of the attribute
   * @returns The constructed WFS URL
   */
  private buildWfsUrl(layer: Layer<Source>, attributeName: string): string {
    const baseUrl = getWfsUrl(layer);
    const params = [
      'service=WFS',
      'version=2.0.0',
      'request=GetPropertyValue',
      `typename=${layer.get('layerName')}`,
      `valueReference=${attributeName}`,
      'outputFormat=application/json',
    ].join('&');
    return this.hsUtilsService.proxify(`${baseUrl}?${params.toString()}`);
  }

  /**
   * Extracts attribute values from the WFS response
   * @param response The WFS response (can be JSON or XML)
   * @param attribute The WFS feature attribute
   * @returns An array of unique, sorted attribute values
   */
  private extractValuesFromResponse(
    response: any,
    attribute: WfsFeatureAttribute,
  ): any[] {
    let values: any[] = [];

    if (typeof response === 'string') {
      // XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response, 'text/xml');
      /**
       * Extract values from the 'namespace:attributeName' elements
       * namespace is extracted from the layerName eg.'filip:layer'
       */
      const elementName = `${this.selectedLayer.layer.get('layerName').split(':')[0]}:${attribute.name}`;
      const valueElements = xmlDoc.getElementsByTagName(elementName);
      values = Array.from(valueElements).map((el) =>
        attribute.isNumeric ? +el.textContent : el.textContent.trim(),
      );
    } else if (response.features && Array.isArray(response.features)) {
      // JSON response
      values = response.features.map(
        (feature) => feature.properties[attribute.name],
      );
    }
    // Return unique, sorted values
    return [...new Set(values)].sort((a, b) => {
      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
      }
      return a - b;
    });
  }
}
