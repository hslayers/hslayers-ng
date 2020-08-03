export interface SaverServiceInterface {
  save(compositionJson, endpoint, data, saveAsNew): void;
}
