import express from 'express'
import { protect, roleProtect } from '../middleware/authMiddleware';
import { getProfile, updateProfile, getProfileInstructor , updateProfileInstructor, updateSemester} from '../controller/profileController';
const router = express.Router()
//fetching gettting profile
router.get('/:studentId',getProfile )
//(update profile)
router.put('/edit',updateProfile)
//fetching instructor profile
router.get('/instructor/:instructorId', protect, roleProtect(['instructor']), getProfileInstructor);
//(update instructor profile)
router.put('/update-instructor', protect, roleProtect(['instructor']), updateProfileInstructor);
//update sem for instructor and student
router.put('/update-semester',protect,roleProtect(['instructor','student']),updateSemester)
export default router;