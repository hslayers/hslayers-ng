import {Subscription} from 'rxjs';

export interface HsAddDataUrlComponentInterface {
  owsConnectingSubscription: Subscription;
  connect(layerToSelect?: string): Promise<void>;
  setUrlAndConnect(url: string, layer: string): void;
  updateUrl(url: string): void;
}
