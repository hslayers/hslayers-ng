/**
 * @param shallow Wether to go through full depth of layer tree or to stop on first queriable
 */
export type addLayersRecursivelyOptions = {
  checkedOnly?: boolean;
  style?: string;
  shallow?: boolean;
};
