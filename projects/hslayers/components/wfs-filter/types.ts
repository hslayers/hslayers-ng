// Enumeration for Filter Types
export enum FilterType {
  Comparison = 'comparison',
  Logical = 'logical',
  Like = 'like',
  IsNull = 'isNull',
  Between = 'between',
}

// Enumeration for Comparison Operators
export enum ComparisonOperator {
  EqualTo = '==',
  NotEqualTo = '!=',
  LessThan = '<',
  GreaterThan = '>',
  LessThanOrEqualTo = '<=',
  GreaterThanOrEqualTo = '>=',
}

// Enumeration for Logical Operators
export enum LogicalOperator {
  And = 'AND',
  Or = 'OR',
  Not = 'NOT',
}

// Base interface for all filters
export interface FilterBase {
  type: FilterType;
}

/* eslint-disable no-use-before-define */
export type Filter =
  | ComparisonFilter
  | LikeFilter
  | IsNullFilter
  | BetweenFilter
  | LogicalFilter;
/* eslint-enable no-use-before-define */

// Comparison Filter Interface
export interface ComparisonFilter extends FilterBase {
  type: FilterType.Comparison;
  operator: ComparisonOperator;
  property: string;
  value: string | number;
}

// Like Filter Interface
export interface LikeFilter extends FilterBase {
  type: FilterType.Like;
  property: string;
  value: string;
  matchCase?: boolean; // Optional, whether to match case or not
}

// IsNull Filter Interface
export interface IsNullFilter extends FilterBase {
  type: FilterType.IsNull;
  property: string;
}

// Between Filter Interface
export interface BetweenFilter extends FilterBase {
  type: FilterType.Between;
  property: string;
  lowerBoundary: number;
  upperBoundary: number;
}

// Logical Filter Interface (references the 'FilterBase' type for recursive structure)
export interface LogicalFilter extends FilterBase {
  type: FilterType.Logical;
  operator: LogicalOperator;
  filters: Filter[]; // Array of sub-filters of any type
}
