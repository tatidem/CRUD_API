import { validate as uuidValidate } from 'uuid';

export const validateUUID = (id: string): boolean => {
  return uuidValidate(id);
};