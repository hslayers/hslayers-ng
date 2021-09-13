import {Subscription} from 'rxjs';

export interface HsAddDataUrlTabInterface {
  owsConnectingSubscription: Subscription;
  hasChecked?: boolean;
  connect(layerToSelect?: string): Promise<void>;
  setUrlAndConnect(url: string, layer: string): void;
  updateUrl(url: string): void;
}
