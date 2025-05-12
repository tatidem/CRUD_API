import { Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../services/users';
import { validateUUID } from '../utils/validateUUID';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!validateUUID(userId)) {
      res.status(400).json({ message: 'Invalid user ID format' });
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, age, hobbies } = req.body;

    if (!username || !age || !hobbies) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (typeof username !== 'string' || typeof age !== 'number' || !Array.isArray(hobbies)) {
      res.status(400).json({ message: 'Invalid field types' });
      return;
    }

    const newUser = await createUser({ username, age, hobbies });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const modifyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!validateUUID(userId)) {
      res.status(400).json({ message: 'Invalid user ID format' });
      return;
    }

    const { username, age, hobbies } = req.body;

    if (!username || !age || !hobbies) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (typeof username !== 'string' || typeof age !== 'number' || !Array.isArray(hobbies)) {
      res.status(400).json({ message: 'Invalid field types' });
      return;
    }

    const updatedUser = await updateUser(userId, { username, age, hobbies });
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
};

export const removeUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!validateUUID(userId)) {
      res.status(400).json({ message: 'Invalid user ID format' });
      return;
    }

    const isDeleted = await deleteUser(userId);
    if (!isDeleted) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};