import {Subscription} from 'rxjs';

export interface HsUrlComponentModel {
  owsConnectingSubscription: Subscription;
  connect(layerToSelect?: string): Promise<void>;
  setUrlAndConnect(url: string, layer: string): void;
}
