import { Request, Response } from 'express';
import User from '../models/user';
import Course from '../models/course';
import Profile from '../models/profile';



//create new cousre(admin or ins only)
export const createCourse = async (req: Request, res: Response) => {
    try {
        const { title, description, category, syllabus, instructorId } = req.body;
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        let assignedInstructorId: string;
        let addedBy: { createdBy: "admin" | "instructor"; Id: string };

        if (userRole === "admin") {
            if (!instructorId) {
                res.status(400).json({ message: "Instrcutor id is Required When an admin creates course" })
                return;
            }
            const instructorExist = await User.findById(instructorId)
            if (!instructorExist) {
                res.status(400).json({ message: "Invalid Instructor Id" })
                return;
            }
            assignedInstructorId = instructorId;
            addedBy = { createdBy: "admin", Id: userId };

        } else if (userRole === "instructor") {
            assignedInstructorId = userId;
            addedBy = { createdBy: "instructor", Id: userId };
        } else {
            res.status(400).json({ message: "You are not authorized to create course" })
            return;
        }
        const timestamp = Date.now();
        const uniqueCourseId = `${title.replace(/\s+/g, "-").toLowerCase()}-${timestamp}`;

        const instructorProfile = await Profile.findOne({ user: assignedInstructorId });
        if (!instructorProfile) {
            res.status(400).json({ message: "Instrcutor profile not found" })
            return
        }
        const semester = instructorProfile.semester;
        const instructor = await User.findById(assignedInstructorId).populate('profile')
        if (!instructor) {
            res.status(404).json({ message: "Instructor not found" });
            return
        }

        if (instructor.isVerified === 0) {
            res.status(403).json({ message: "You must complete your profile before creating a course" });
            return
        }

        const newCourse = new Course({
            title,
            description,
            instructor: assignedInstructorId,
            category,
            syllabus,
            semester,
            status: "active",
            added_by: addedBy,
            courseId: uniqueCourseId
        });
        await newCourse.save();
        res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error: any) {
        res.status(400).json({ message: 'Error creating course', error: error.message });
    }
};
//enrolling in course(many to many)
export const enrollCourse = async (req: Request, res: Response) => {
    const { courseId } = req.body;
    const studentId = (req as any).user.userId;
    try {
        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }
        const student = await User.findById(studentId);
        if (!student) {
            res.status(404).json({ message: "student not found" })
            return;
        }
        if (student.isVerified === 0) {
            res.status(400).json({ message: "You must update your profile with a semester before enrolling in a course" })
            return;
        }
        const studentProfile = await Profile.findOne({ user: studentId });
        if (!studentProfile) {
            res.status(404).json({ message: "Student profile not found" })
            return;
        }
        if (studentProfile.semester !== course.semester) {
            res.status(400).json({ message: "You can only enroll in course for your ssemester" })
            return;
        }
        if (course.students.includes(studentId)) {
            res.status(400).json({ message: "You are already enrolled in this course" });
            return;
        }

        course.students.push(studentId);
        await course.save();
        res.status(200).json({ message: "You have been enrolled in this course", course });
    } catch (error: any) {
        res.status(500).json({ message: "Error enrolling in course", error: error.message });

    }
};
//Get All Courses Created by a Specific Instructor
export const getCourseByIns = async (req: Request, res: Response) => {
    const { instructorId } = req.body;
    try {
        const courses = await Course.find({ instructor: instructorId });
        if (!courses || courses.length === 0) {
            res.status(404).json({ message: "No Courses found for this Intructor" })
        }
        res.status(200).json({ message: "Courses fetched sucesfully", courses })
    } catch (error: any) {
        console.log(error)
        res.status(500).json({ message: "Error fetching courses", error: error.message })
    }

};
//// Single API for Admin, Instructor, and Student to fetch courses
export const getCourses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const { semester } = req.query;
        let filter: any = {};

        if (semester) {
            const semesterNumber = Number(semester);
            if (isNaN(semesterNumber)) {
                res.status(400).json({ message: "Semester must be number" });
            }
            filter.semester = semesterNumber;
        }
        let courses;
        if (userRole === "admin") {


            courses = await Course.find(filter).populate("instructor", "username email").select(" courseId title semester status createdAt");
        } else if (userRole === "instructor") {
            courses = await Course.find({ instructor: userId, ...filter }).select(" courseId title semester status createdAt")
        } else if (userRole === "student") {
            const studentProfile = await Profile.findOne({ user: userId })
            if (!studentProfile) {
                res.status(400).json({ message: "student profile not found" })
                return;
            }
            courses = await Course.find({ semester: studentProfile.semester, status: "active", ...filter }).select(" courseIdtitle semester status createdAt")
        }
        if (!courses || courses.length === 0) {
            res.status(400).json({ message: "No courses found" })
            return;
        }
        res.status(200).json({ message: "course fetched Sucesfully", courses })
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching courses", error: error.message })
    }
};
//o Update Course Status (Admin & Instructor Only)
export const updateCourseStatus = async (req: Request, res: Response) => {
    try {
        const { courseId, status } = req.body;
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        if (!['active', 'inactive'].includes(status)) {
            res.status(400).json({ message: "Status must be either active or inactive" })
            return;
        }
        let course;
        if (userRole === "admin") {
            course = await Course.findById(courseId)
        } else if (userRole == "instructor") {
            course = await Course.findOne({ courseId, instructor: userId })
        } else {
            res.status(400).json({ message: "You are not authorized to update course status" })
            return;
        }
        if (!course) {
            res.status(400).json({ message: "course not found or you are not authorized   " })
            return
        }
        course.status = status;
        await course.save()
        res.status(200).json({ message: "Course status changed succesfully", course })
    } catch (error: any) {
        res.status(500).json({ message: "Error updating course", error: error.message });
    }
};
//studnets can de-enroll in course
export const deEnrollCourse = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.body;
        const studentId = (req as any).user.userId;
        const course = await Course.findById(courseId);
        if (!course) {
            res.status(400).json({ message: "Course not found" })
            return;
        }
        if (!course.students.includes(studentId)) {
            res.status(400).json({ message: "You are not enrolled in this course" })
            return;
        }
        course.students = course.students.filter((id) => id.toString() !== studentId)
        await course.save();
        res.status(200).json({ message: "You have been de-enrolled from the course" })




    } catch (error: any) {
        res.status(500).json({ message: "Error de-enrolling course", error: error.message });
    }
};
//remove or transfer  courses for instrcutor 
export const removeOrTransferCourses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const { action, newInstructorId, courseIds } = req.body;
        if (userRole !== "instructor") {
            res.status(403).json({ message: "Only instructors can remove or transfer courses " })
            return;
        }
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            res.status(400).json({ message: "Course IDs must be an array with at least one course" });
            return;
        }
        const courses = await Course.find({ courseId: { $in: courseIds }, instructor: userId });
        if (courses.length === 0) {
            res.status(400).json({ message: "No courses found or you are not authorized" });
            return;
        }
        if (action === "delete") {
            const coursesWithStudents = courses.filter(course => course.students.length > 0);
            if (coursesWithStudents.length > 0) {
                res.status(400).json({ message: "cannot delete courses with students enrolled in it", coursesWithStudents: coursesWithStudents.map(course => course.courseId) });
                return;
            }
            await Course.deleteMany({ courseId: { $in: courseIds } })
            res.status(200).json({ message: "Courses deleted Suceesfully" });
            return;
        } else if (action === "transfer") {
            if (!newInstructorId) {
                res.status(400).json({ message: "New instructor ID is required" });
                return;
            }
            const newInstructor = await User.findById(newInstructorId);
            if (!newInstructor || newInstructor.role !== "instructor") {
                res.status(400).json({ message: "Invalid instrcutor ID" });
                return;
            }
            await Course.updateMany({ courseId: { $in: courseIds } }, { instructor: newInstructorId })
            res.status(200).json({ message: "Course transffered suceesfully" })
            return;
        } else {
            res.status(400).json({ message: "invalid action" });
            return;
        }
    } catch (error: any) {
        res.status(500).json({ message: "Error removing or transferring courses", error: error.message });

    }
};
//end or resume course (instrcutor only)   
export const endorResumeCourses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const { action } = req.body;
        if (userRole !== "instructor") {
            res.status(403).json({ message: "Only instructors can end or resume courses" });
            return;
        }
        const instructorCourses = await Course.find({ instructor: userId });
        if (!instructorCourses || instructorCourses.length === 0) {
            res.status(400).json({ message: "No courses found" });
            return;
        }
        if (action === "end") {
            const hasEnrolledStudents = instructorCourses.some(course => course.students.length > 0);
            if (hasEnrolledStudents) {
                res.status(400).json({ message: "Cannot end courses with students enrolled in it" });
                return;
            }
            await User.findOneAndUpdate({ _id: userId }, { is_ended: 1 });
            res.status(200).json({ message: "courses ended succesfully" })
            return;
        } else if (action === "resume") {
            await User.findOneAndUpdate({ _id: userId }, { is_ended: 0 });
            res.status(200).json({ message: "courses resumed succesfully" })
            return;
        } else {
            res.status(400).json({ message: "Invalid action" });
            return;
        }
    } catch (error: any) {
        res.status(500).json({ message: "Error updating course status", error: error.message });

    }
};
//remove students from course(instrcutor)
export const removeStudentsFromCourse = async (req: Request, res: Response) => {
    try {
        const instructorId = (req as any).user.userId;
        const { courseId, studentIds } = req.body;
        if (!courseId || !studentIds || !Array.isArray(studentIds)) {
            res.status(400).json({ message: "Course Ids and array of students ids is required" })
            return;
        }
        const course = await Course.findOne({ courseId, instructor: instructorId });
        if (!course) {
            res.status(400).json({ message: "Course not found you are not instrcutor" })
            return;
        }
        course.students = course.students.filter((studentId) => !studentIds.includes(studentId.toString()));
        await course.save();
        res.status(200).json({ message: "students removed Suceesfully", updatedCourse: course });
    } catch (error: any) {
        res.status(500).json({ message: "Error removing students from course", error: error.message });
    }

}
//admin can delete instrcutor Courses
export const deleteInstructorCourses = async (req: Request, res: Response) => {
    try {
        const { courseIds, instructorId } = req.body;
        const instructor = await User.findById(instructorId);
        if (!instructor) {
            res.status(400).json({ message: "instrcutor not found " })
            return;
        }
        const courses = await Course.find({ courseId: { $in: courseIds }, instructor: instructorId }).select("title students")
        if (courses.length === 0) {
            res.status(400).json({ message: "No courses found for this instrcutor" })
            return;
        }
        const coursesWithStudents = courses.filter(course => course.students.length > 0)
        if (coursesWithStudents.length > 0) {
            res.status(400).json({
                message: "Cannot delete Courses beCause students are enroleed in it",
                coursesWithStudents: coursesWithStudents.map(course => ({
                    courseId: course.courseId,
                    courseTitle: course.title,
                    enrolledStudents: course.students.length

                }))
            });
            return;
        }
        await Course.deleteMany({ courseId: { $in: courseIds }, students: { $size: 0 } });
        res.status(200).json({ message: "Courses deleted successfully" });
        return;
    } catch (error: any) {
        res.status(500).json({ message: "Error deleting instructor courses", error: error.message });

    }
};
// /upload course materials (instrcutor  only)
// export const uploadCourseMaterials=async (req:Request,res:Response)=>{
//     try{
//         const {courseId}=req.params;
//         const course=await Course.findById(courseId);
//         if(!course){
//             res.status(400).json({message:"Course not found"});
//             return;
//             }
//             const {file:any }=req;
//             const courseMaterials=await Course.findByIdAndUpdate(courseId,{ $push: { materials: any }
//                 });
//             res.status(200).json({message:"Course materials uploaded successfully"});
//             return;
//         } catch (error: any) {
//             res.status(500).json({ message: "Error uploading course materials", error:error.message});
//             return;
//         }

//     }
//upload course materails (instrcutor only)
export const uploadCourseMaterials = async (req: Request, res: Response) => {
    try {
        console.log("recived Files", req.files)
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ message: "No files uploaded" });
            return;
        }
        const instructorUsername = (req as any).user.username;
        const { courseId } = req.body;
        const course = await Course.findOne({ courseId,instructorUsername});
        if (!course) {
            res.status(400).json({ message: "Course not found or Unauthorized" })
            return;
        }
        const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
            filename: file.filename,
            path: `/uploads/${instructorUsername}/courses/${courseId}/${file.filename}`,
          }));
        if(uploadedFiles.length===0){
            res.status(400).json({message:"No files Uploadedd"})
        }
        await Course.findOneAndUpdate(
            { courseId: courseId },
            { $push: { materials: { $each: uploadedFiles } } },
            { new: true, runValidators: true }
          );
          
        res.status(200).json({message:"File Sucessfully uploaded",files:uploadedFiles})


    } catch (error: any) {
        res.status(500).json({ message: "Error uploading course materials", error: error.message });
        return;
    }
}
