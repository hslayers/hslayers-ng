export type ColumnWrapper = {
  checked: boolean;
  name: string;
  regressionOutput?: {
    m: number;
    b: number;
  };
};
