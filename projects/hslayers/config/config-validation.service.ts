import {Injectable} from '@angular/core';
import {HsConfigObject} from './config.service';

/**
 * Type for validation rules
 * @param condition - Condition function that should return true in case of conflict.
 * @param message - The message to display if the condition is true (conflict found)
 */
export type HsConfigValidationRule = {
  condition: (config: HsConfigObject) => boolean;
  message: string;
};

@Injectable({
  providedIn: 'root',
})
export class HsConfigValidationService {
  /**
   * Default validation rules for detecting incompatible configuration combinations
   */
  private readonly defaultValidationRules: HsConfigValidationRule[] = [
    {
      condition: (config) =>
        config.defaultComposition &&
        config.panelsEnabled?.compositions === false,
      message: 'defaultComposition requires compositions panel to be enabled',
    },
    {
      condition: (config) =>
        config.panelsEnabled?.sensors === true && !config.senslog?.url,
      message: 'sensors panel requires senslog.url to be configured',
    },
  ];

  constructor() {}

  /**
   * Validates configuration for incompatible combinations and returns warning messages
   * @param config - The configuration object to validate
   * @param userRules - Optional user-defined validation rules from config
   * @param useDefaultRules - Whether to include default validation rules (default: true)
   * @returns Array of warning messages for detected conflicts
   */
  validate(
    config: HsConfigObject,
    userRules?: HsConfigValidationRule[],
    useDefaultRules: boolean = true,
  ): string[] {
    const warnings: string[] = [];

    try {
      // Start with default rules if enabled
      const allRules: HsConfigValidationRule[] = useDefaultRules
        ? [...this.defaultValidationRules]
        : [];

      // Add user rules if provided
      if (userRules && Array.isArray(userRules)) {
        userRules.forEach((userRule) => {
          // Validate user rule
          if (!userRule.condition || !userRule.message) {
            console.warn(
              'HsConfigValidation Warning: Invalid validation rule provided. Rule must have condition and message properties.',
              userRule,
            );
            return;
          }

          allRules.push(userRule);
        });
      }

      // Run validation with all rules
      allRules.forEach((rule, index) => {
        try {
          if (rule.condition(config)) {
            warnings.push(`Configuration conflict detected: ${rule.message}`);
          }
        } catch (e) {
          warnings.push(`Error in validation rule #${index + 1}: ${e.message}`);
        }
      });
    } catch (e) {
      warnings.push(
        `Critical error during configuration validation: ${e.message}`,
      );
    }

    return warnings;
  }
}
