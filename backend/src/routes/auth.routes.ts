import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { RegisterSchema, LoginSchema } from '../validations/auth.schema';


const r = Router();
r.post('/register', validate(RegisterSchema), register);
r.post("/login", validate(LoginSchema), login);
export default r;
