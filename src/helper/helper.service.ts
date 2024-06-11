import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperService {
  /**
   * Excludes specified keys from a user object.
   *
   * This method takes a user object and an array of keys, then returns a new object
   * with the specified keys excluded from the user object.
   *
   * @param {any} object - The user object from which to exclude keys.
   * @param {string[]} keys - An array of keys to be excluded from the user object.
   * @returns {Object} A new object with the specified keys excluded.
   *
   * @example
   * const user = { id: 1, name: 'Alice', password: 'secret', email: 'alice@example.com' };
   * const keysToExclude = ['password'];
   * const result = exclude(user, keysToExclude);
   * // result: { id: 1, name: 'Alice', email: 'alice@example.com' }
   */
  public excludeField(object: any, keys: string[]): any {
    return Object.fromEntries(
      Object.entries(object).filter(([key]) => !keys.includes(key)),
    );
  }
}
