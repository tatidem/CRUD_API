import { v4 as uuidv4 } from 'uuid';
import { User, UserInput } from '../types/users';

let users: User[] = [];

export const getAllUsers = async (): Promise<User[]> => {
  return users;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  return users.find((user) => user.id === id);
};

export const createUser = async (userData: UserInput): Promise<User> => {
  const newUser: User = {
    id: uuidv4(),
    ...userData,
  };
  users.push(newUser);
  return newUser;
};

export const updateUser = async (
  id: string,
  userData: UserInput
): Promise<User | undefined> => {
  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex === -1) return undefined;

  const updatedUser: User = {
    id,
    ...userData,
  };
  users[userIndex] = updatedUser;
  return updatedUser;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const initialLength = users.length;
  users = users.filter((user) => user.id !== id);
  return users.length !== initialLength;
};

export const getUsersForTesting = (): User[] => users;
export const setUsersForTesting = (testUsers: User[]): void => {
  users = testUsers;
};