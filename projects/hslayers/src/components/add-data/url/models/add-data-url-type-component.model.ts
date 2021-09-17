import {Subscription} from 'rxjs';

export interface HsAddDataUrlComponentModel {
  owsConnectingSubscription: Subscription;
  connect(layerToSelect?: string): Promise<void>;
  setUrlAndConnect(url: string, layer: string): void;
}
