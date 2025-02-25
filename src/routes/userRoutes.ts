import  express  from "express";
import { changePass, loginUser, registerUser } from "../controller/userController";
import { protect, roleProtect } from "../middleware/authMiddleware";


const router = express.Router();
//register
router.post('/register', registerUser);
//loggin with jwt
router.post('/login', loginUser)
//change pass
router.post('/change-pass',protect,roleProtect(['student','instructor']),changePass)

export default router;