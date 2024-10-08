export interface HsSublayer {
  name: string; // Unique identifier for the layer
  title: string;
  visible: boolean; // Visibility state of this layer
  previousVisible: boolean; // Previous visibility state
  sublayers?: HsSublayer[]; // Nested sublayers, if any
  maxResolution?: number;
}
