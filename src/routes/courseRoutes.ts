import express from 'express'
import { protect } from '../middleware/authMiddleware'
import { roleProtect } from '../middleware/authMiddleware'
import upload from '../middleware/multerconfig'
import multer from 'multer'
import { createCourse, enrollCourse, deEnrollCourse, getCourseByIns,getCourses,updateCourseStatus, removeOrTransferCourses, endorResumeCourses, removeStudentsFromCourse, deleteInstructorCourses, uploadCourseMaterials, createLessonWithImage, getLesson, deleteLesson} from '../controller/courseController'
import { deleteCourseMaterials,updateLesson } from '../controller/courseController'

const router = express.Router()
//route to create new cousre(admin or ins only)
router.post('/', protect, roleProtect(['admin', 'instructor']), createCourse)


//enrolling in course(many to many)
router.post("/enroll/:courseId", protect, roleProtect(['student']),enrollCourse)
//get course and populate email and username
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
//instructor can remove students from course
router.post('/remove-students',protect,roleProtect(["instructor"]),removeStudentsFromCourse)
//admin can delete  instrcutor courses 
router.post('/delete-courses',protect,roleProtect(['admin']),deleteInstructorCourses)
//uploading cours materilas(instrcutor only)
router.post('/upload-materials',protect,roleProtect(['instructor']),upload.array("files"),uploadCourseMaterials)
//dleteing course materilas
router.delete("/delete-materials",protect,roleProtect(['instructor']),deleteCourseMaterials)
//create lessons  with image 
router.post('/create-lessons',protect,roleProtect(['instructor']),upload.array("materials",5),createLessonWithImage)
//get lesson
router.get("/getLesson/:courseId",protect,roleProtect(['student']),getLesson)
//update lesson instrucor only
router.put("/update-lesson/:courseId/:lessonId",protect,roleProtect(["instructor"]),upload.array("files",5),updateLesson)
//delete lesson instrutor only
router.delete("/delete-lesson/:lessonId",protect,roleProtect(["instructor"]),deleteLesson)
export default router;      

