export type ColumnWrapper = {
  checked: boolean;
  name: string;
  shift?: number;
  regressionOutput?: {
    m: number;
    b: number;
  };
};
