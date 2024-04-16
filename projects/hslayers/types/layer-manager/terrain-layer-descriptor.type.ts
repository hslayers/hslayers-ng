export type HsTerrainLayerDescriptor = {
  title?: string;
  url: string;
  active?: boolean; //FIXME: why active and visible? What is the difference??
  visible?: boolean;
  /**
   * https://cesium.com/learn/cesiumjs/ref-doc/CesiumTerrainProvider.html#.ConstructorOptions
   */
  options?;
  type?: 'terrain';
};
