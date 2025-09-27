import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { RegisterSchema } from '../validations/auth.schema';

const r = Router();
r.post('/register', validate(RegisterSchema), AuthController.register);

export default r;
