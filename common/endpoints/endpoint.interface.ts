export interface HsEndpoint {
  type: string;
  title: string;
  url: string;
  download?: boolean;
  language?;
  liferayProtocol?;
  originalConfiguredUser?;
  user?;
  code_list_url?: string;
  code_lists?;
  datasourcePaging?: {
    start?: number;
    limit: number;
    loaded?: boolean;
    matched?;
    next?;
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
