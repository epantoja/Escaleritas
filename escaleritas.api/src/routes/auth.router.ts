import { Router } from 'express';
import {
  loginController,
  registerController,
  meController,
  actualizarPerfilController,
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
router.put('/me', verificaToken, actualizarPerfilController);

export default router;
module.exports = router;

