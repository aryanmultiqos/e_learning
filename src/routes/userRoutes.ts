import  express  from "express";
import { loginUser, registerUser } from "../controller/userController";


const router = express.Router();
//register
router.post('/register', registerUser);
//loggin with jwt
router.post('/login', loginUser)

export default router;