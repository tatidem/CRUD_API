import { DbUser } from '../types/users';

export function validateUser(input: unknown): string[] {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return ['Invalid user data structure'];
  }

  const { username, age, hobbies, ...rest } = input as DbUser;

  if (typeof username !== 'string') errors.push('Invalid username format');
  if (!Number.isInteger(age) || age < 0) errors.push('Invalid age value');
  if (!Array.isArray(hobbies) || hobbies.some((h) => typeof h !== 'string')) {
    errors.push('Invalid hobbies format');
  }

  const extraKeys = Object.keys(rest);
  if (extraKeys.length) errors.push(`Unexpected fields: ${extraKeys.join(', ')}`);

  return errors;
}

export function isUUID(value: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}
