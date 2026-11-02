import { Router } from 'express';
import {
  loginController,
  registerController,
  meController,
  rolesController,
} from '../controller/auth.controller';
import { verificaToken } from '../middlewares/autenticacion';

const router = Router();

// Endpoints públicos de autenticación
router.post('/login', loginController);
router.post('/register', registerController);
router.get('/roles', rolesController);

// Endpoints protegidos por JWT
router.get('/me', verificaToken, meController);

export default router;
module.exports = router;

