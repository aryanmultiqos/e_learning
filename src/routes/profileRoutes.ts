import express from 'express'
import { protect, roleProtect } from '../middleware/authMiddleware';
import { getProfile, updateProfile, getProfileInstructor , updateProfileInstructor} from '../controller/profileController';
const router = express.Router()
//fetching gettting profile
router.get('/:studentId',getProfile )
//(update profile)
router.put('/edit',updateProfile)
router.get('/instructor/:instructorId', protect, roleProtect(['instructor']), getProfileInstructor);
router.put('/update-instructor', protect, roleProtect(['instructor']), updateProfileInstructor);


export default router;