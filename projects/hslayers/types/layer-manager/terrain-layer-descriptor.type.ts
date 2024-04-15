export type HsTerrainLayerDescriptor = {
  title?: string;
  url: string;
  active?: boolean; //FIXME: why active and visible? What is the difference??
  visible?: boolean;
  type?: 'terrain';
};
