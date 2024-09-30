import {
  CombinationFilter,
  ComparisonFilter,
  NegationFilter,
} from 'geostyler-style';

export type LogicalOperatorType = 'AND' | 'OR' | 'NOT';
export type ComparisonOperatorType = 'COMPARE';
export type FilterType = LogicalOperatorType | ComparisonOperatorType;

export type Filter = ComparisonFilter | NegationFilter | CombinationFilter;
