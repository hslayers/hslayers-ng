export interface HsSaverService {
  save(compositionJson, endpoint, data, saveAsNew, app: string): Promise<any>;
}
