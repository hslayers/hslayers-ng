export interface HsSaverService {
  save(compositionJson, endpoint, data, saveAsNew): Promise<any>;
}
