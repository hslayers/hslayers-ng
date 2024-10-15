export interface HsSublayer {
  /**
   * Unique identifier for the layer
   */
  name: string;
  title: string;
  /**
   * Visibility state of this layer
   */
  visible: boolean;
  /**
   * Previous visibility state
   */
  previousVisible: boolean;
  /**
   * Nested sublayers, if any
   */
  sublayers?: HsSublayer[];
  maxResolution?: number;
}
