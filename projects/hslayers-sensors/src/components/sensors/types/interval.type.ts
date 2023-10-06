export type Interval = {
  name: '1H' | '1D' | '1W' | '1M' | '6M' | 'Custom';
  amount?: number;
  unit?: 'hours' | 'days' | 'weeks' | 'months';
  loading?: boolean;
};

export type CustomInterval = Interval & {
  fromTime: any;
  toTime: any;
}
