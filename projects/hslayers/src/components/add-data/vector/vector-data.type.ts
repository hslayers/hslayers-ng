import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

export type vectorDataObject = {
  srs: string;
  // Not possible to save KML to layman yet
  abstract: string;
  addUnder: Layer<Source>;
  base64url: string;
  dataType: string;
  errorOccurred: boolean;
  extract_styles: boolean;
  featureCount: number;
  features: Array<any>;
  folder_name: string;
  name: string;
  saveAvailable: boolean;
  saveToLayman: boolean;
  showDetails: boolean;
  title: string;
  type: string;
  url: string;
};
