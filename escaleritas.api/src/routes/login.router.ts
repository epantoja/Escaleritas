import { Router, Request, Response, NextFunction } from 'express';
import { postLogin } from '../controller/login.controller';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { usuario, clave } = req.body;
    const data = await postLogin({ usuario, clave });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
module.exports = router;
