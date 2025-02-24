import express from 'express'
import { protect } from '../middleware/authMiddleware'
import { roleProtect } from '../middleware/authMiddleware'
import { createCourse , enrollCourse, deEnrollCourse, getCourseByIns,getCourses,updateCourseStatus, removeOrTransferCourses, endorResumeCourses} from '../controller/courseController'


const router = express.Router()
//route to create new cousre(admin or ins only)
router.post('/', protect, roleProtect(['admin', 'instructor']), createCourse)


//enrolling in course(many to many)
router.post("/enroll/:courseId", protect, roleProtect(['student']),enrollCourse)
//get course and populate email and username
// router.get('/:courseId',getCourseById)
//get all cousese created by instrcutor
router.get('/instructor/:instructorId',getCourseByIns )
//single api to show list for admin instructor and student to fetch courses
router.get("/list", protect, getCourses);
//to update course status(admin & instructor)
router.put("/status", protect, roleProtect(["admin", "instructor"]), updateCourseStatus);
// de-enroull course fro student only
router.put("/de-enroll", protect, roleProtect(["student"]), deEnrollCourse);
//remove or transfer courses for instrcutor
router.post('/manage',protect,roleProtect(['instructor']), removeOrTransferCourses)
//endor resume courses
router.patch('/end-resume',protect,roleProtect(['instructor']), endorResumeCourses)



export default router;      

