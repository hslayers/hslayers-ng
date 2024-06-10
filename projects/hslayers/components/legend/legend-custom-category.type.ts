export type HsCustomLegendCategory = {
  /**
   * Unique category name
   */
  name: string;
  /**
   * rgb(a) or hex encoded color string
   * (mutually exclusive with path)
   */
  color?: string;
  /**
   * Path to an icon
   * (mutually exclusive with color)
   */
  path?: string;
  /**
   * Optional height of the icon in pixels
   */
  height?: number;
};
