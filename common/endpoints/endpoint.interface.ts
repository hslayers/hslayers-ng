export interface HsEndpoint {
  type: string;
  title: string;
  url: string;
  language?;
  liferayProtocol?;
  originalConfiguredUser?;
  user?;
  datasourcePaging?: {
    start?: number;
    limit: number;
    loaded?: boolean;
  };
  compositionsPaging?: {
    start?: number;
    limit: number;
    loaded?: number;
  };
  paging?: {
    itemsPerPage: number;
  };
  getCurrentUserIfNeeded?(endpoint: HsEndpoint): void;
}
