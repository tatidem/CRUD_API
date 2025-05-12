import { Router } from 'express';
import {
  getUsers,
  getUser,
  addUser,
  modifyUser,
  removeUser,
} from '../controllers/users';

const router = Router();

router.get('/', getUsers);
router.get('/:userId', getUser);
router.post('/', addUser);
router.put('/:userId', modifyUser);
router.delete('/:userId', removeUser);

export default router;