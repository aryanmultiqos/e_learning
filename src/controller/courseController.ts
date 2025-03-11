import { Request, response, Response } from 'express';
import User from '../models/user';
import Course from '../models/course';
import Profile from '../models/profile';
import Lesson from '../models/Lesson';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs'


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
        console.log("Received courseId:", courseId); // Debugging

        const course = await Course.findOne({ courseId });

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
        res.status(200).json({
            message: "You have been enrolled in this course",
            course: {
                courseId: course.courseId,
                title: course.title,
                description: course.description,
                instructor: course.instructor,
                students: course.students,
                category: course.category,
                syllabus: course.syllabus,
                semester: course.semester,
                status: course.status,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt
            }
        });
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
        const course = await Course.findOne({ courseId });
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
        
        const instructorUsername = (req as any).user.username;
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
        console.log(courses,"course")
        if (courses.length === 0) {
            res.status(400).json({ message: "No courses found or you are not authorized" });
            return;
        }
        if (action === "delete") {
            const coursesWithStudents = courses.filter(course => course.students.length > 0);
            if (coursesWithStudents.length > 0) {
                res.status(400).json({ message: "cannot delete courses with students enrolled in it", 
                    coursesWithStudents: coursesWithStudents.map(course => ({
                        courseId: course.courseId,
                        students:course.students
                    }))
                });
                return;
            }
           
            for (const course of courses) {
                 await Lesson.deleteMany({ course: course._id });
                const courseFolderPath = path.join(__dirname, `../../uploads/${instructorUsername}/courses/${course.courseId}`);
                console.log('courseFolderPath',courseFolderPath);
                
                if (fs.existsSync(courseFolderPath)) {
                     fs.rmSync(courseFolderPath, { recursive: true, force: true });
                    console.log("Deleted Course Folder:", courseFolderPath);
                }
            }
             await Course.deleteMany({ courseId: { $in: courseIds } });
            res.status(200).json({ message: "Courses deleted successfully" });
            return;
        }
        else if (action === "transfer") {
            if (!newInstructorId) {
                res.status(400).json({ message: "New instructor id is requiered" })
                return;
            }
            const newInstructor = await User.findById(newInstructorId);
            if (!newInstructor || newInstructor.role !== "instructor") {
                res.status(400).json({ message: "Invalid instrcutor ID" })
                return;
            }
            for (const course of courses) {
                const oldInstructor = await User.findById(course.instructor);
                const oldInstructorUsername = oldInstructor?.username || "unknown_instructor";
                course.instructor = newInstructorId;
                await course.save();
                await Lesson.updateMany({ course: course._id }, { instructor: newInstructorId })

                const oldFolderPath = path.join(__dirname, `../../uploads/${instructorUsername}/courses/${course.courseId}`);
                const newFolderPath = path.join(__dirname, `../../uploads/${newInstructor.username}/courses/${course.courseId}`);
                if (fs.existsSync(oldFolderPath)) {
                    fs.renameSync(oldFolderPath, newFolderPath);
                    console.log("Renamed Course Folder:", oldFolderPath, "to", newFolderPath);
                }
            }
            res.status(200).json({ message: "Courses transferred successfully" })
            return;
        }

        res.status(400).json({ message: "Invalid action. Must be 'delete' or 'transfer'." });
        return;

    } catch (error: any) {
        res.status(500).json({ message: "Error removing or transferring courses", error: error.message });
        return;
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
//upload course materails (instrcutor only)
export const uploadCourseMaterials = async (req: Request, res: Response) => {
    try {
        console.log("recived Files", req.files)
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ message: "No files uploaded" });
            return;
        }

        const instructorUsername = (req as any).user.username;
        const instructorId = new mongoose.Types.ObjectId((req as any).user.userId);
        const { courseId } = req.body;

        // console.log("Extracted courseId:", courseId);
        //     console.log("Extracted instructorUsername:", instructorUsername);
        //     console.log("User data in request:", (req as any).user);    
        const course = await Course.findOne({ courseId, instructor: instructorId });
        //  console.log("Course found:", course);

        if (!course) {
            res.status(400).json({ message: "Course not found or Unauthorized" })
            return;
        }
        const uploadedFiles = (req.files as Express.Multer.File[]).map(file => ({
            filename: file.filename,
            path: `/uploads/${instructorUsername}/courses/${courseId}/${file.filename}`,
            url: `${req.protocol}://${req.get('host')}/uploads/${instructorUsername}/courses/${courseId}/${file.filename}`
        }));
        if (uploadedFiles.length === 0) {
            res.status(400).json({ message: "No files Uploadedd" })
        }
        await Course.findOneAndUpdate(
            { courseId: courseId },
            { $push: { materials: { $each: uploadedFiles } } },
            { new: true, runValidators: true }
        );
        const responseFiles = uploadedFiles.map(({ url, filename }) => ({ filename, url }));
        res.status(200).json({ message: "File Sucessfully uploaded", files: responseFiles })


    } catch (error: any) {
        res.status(500).json({ message: "Error uploading course materials", error: error.message });
        return;
    }
}
//delete course materails (videos )
export const deleteCourseMaterials = async (req: Request, res: Response) => {
    try {
        console.log(" deleteCourseMaterials function triggered");

        const { courseId, files } = req.body;
        const instructorUsername = (req as any).user.username;

        if (!files || !Array.isArray(files) || files.length === 0) {
            res.status(400).json({ message: "file list is empty" })
            return;
        }
        const instructorId = new mongoose.Types.ObjectId((req as any).user.userId);
        //  console.log("🔹 Received Course ID:", courseId);
        //console.log("🔹 Instructor ID from request:", instructorId);

        const course = await Course.findOne({ courseId, "added_by.Id": instructorId })
        // console.log("📌 Found Course:", course);


        if (!course) {
            res.status(400).json({ message: "Course not found " })
            return;
        }
        console.log(" Course Materials:", course.materials);
        console.log("Requested Files to Delete:", files);
        const materialsToDelete = course.materials.filter((material) => files.includes(material.filename));
        if (materialsToDelete.length === 0) {
            res.status(400).json({ message: "No files to delete" });
            return;
        }
        const courseMaterialsPath = path.join(__dirname, `../../uploads/${instructorUsername}/courses/${courseId}`)
        materialsToDelete.forEach((material) => {
            const filePath = path.join(courseMaterialsPath, material.filename)
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log("file deleted Suceesfully", filePath)
                } catch (err: any) {
                    console.error("Error deleting file", filePath, err.message)
                }
            } else {
                console.log("file not found", filePath)

            }
        })
        await Course.findOneAndUpdate(
            { courseId },
            { $pull: { materials: { filename: { $in: files } } } }
        );
        res.status(200).json({ message: "Deleted Suceesfully" })
    } catch (error: any) {
        res.status(500).json({ message: "Error deleting Corse materilas", error: error.message })
        return;
    }
};
//create lessons with image(instrcutor  image)
export const createLessonWithImage = async (req: Request, res: Response) => {
    try {
        const instructorUsername = (req as any).user.username;
        const instructorId = new mongoose.Types.ObjectId((req as any).user.userId);
        const { title, content, order, courseId } = req.body;

        const course = await Course.findOne({ courseId, instructor: instructorId });
        console.log("Course found:", course);
        if (!course) {
            res.status(400).json({ message: "Course not found" });
            return;
        }
        let uploadedImages: { filename: string; path: string; url: string; uploadedAt: Date }[] = [];
        if (req.files && (req.files as Express.Multer.File[]).length > 0) {
            uploadedImages = (req.files as Express.Multer.File[]).map(file => ({
                filename: file.filename,
                path: `/uploads/${instructorUsername}/courses/${courseId}/${file.filename}`,
                url: `${req.protocol}://${req.get('host')}/uploads/${instructorUsername}/courses/${courseId}/${encodeURIComponent(file.filename)}`,
                uploadedAt: new Date(),
            }));
        }
        const newLesson = new Lesson({
            title,
            content,
            course: course._id,
            order,
            materials: uploadedImages,
            status:"active"
        });
        await newLesson.save();

        const lessonWithCourseId = await Lesson.findById(newLesson._id)
            .populate("course", "courseId");
        console.log(lessonWithCourseId, "lesson")
        if (!lessonWithCourseId) {
            res.status(500).json({ message: "Error fetcging lesson" })
            return;
        }
        res.status(201).json({
            message: "Lesson created successfully",
            Lesson: {
                ...lessonWithCourseId.toObject(),
                course: (lessonWithCourseId.course as any)?.courseId,
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: "Error creating lesson", error: error.message })
        return;
    }
}
//get lesson by student]
export const getLesson = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = new mongoose.Types.ObjectId((req as any).user.userId);
        const userRole = (req as any).user.role;

        console.log("Extracted User ID:", userId);
        console.log("Received Course ID:", courseId);

        const course = await Course.findOne({ courseId: courseId }).populate("students");
        console.log("Fetched Course:", course);

        if (!course) {
            res.status(400).json({ message: "Course not found" });
            return;
        }
        console.log("Course Students:", course.students);
        const isEnrolled = course.students.some((student: any) =>
            student._id.toString() === userId.toString()
        );

        //console.log(isEnrolled, "is")



        if (userRole === "student" && !isEnrolled) {
            res.status(403).json({ message: "You are not enrolled in this course" });
            return;
        }
        const lesson = await Lesson.find({ course: course._id })
        if (!lesson) {
            res.status(400).json({ message: "Lesson not found" });
            return;
        }
        const formattedLesson = {
            title: "Lessons for this course",
            lessons: lesson.map(lesson => ({
                title: lesson.title,
                content: lesson.content,
                order: lesson.order,
                materials: lesson.materials.map(material => ({
                    filename: material.filename,
                    url: `${req.protocol}://${req.get('host')}${material.path.replace(/\s+/g, '%20')}`,
                    uploadedAt: material.uploadedAt
                }))
            })),
            courseMaterials: course.materials.map(material => ({
                filename: material.filename,
                url: `${req.protocol}://${req.get('host')}${material.path.replace(/\s+/g, '%20')}`,
                uploadedAt: material.uploadedAt
            }))
        };


        res.status(200).json({ message: "Lesson Fetched Success", courseId: courseId, lesson: formattedLesson });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching lesson", error: error.message })
        return;
    }
}
//update-lessson instrcutor only
export const updateLesson = async (req: Request, res: Response) => {
    try {
        const { lessonId } = req.params;
        const { title, content, order } = req.body;
        const newFiles = req.files as Express.Multer.File[];

        console.log("Request Body:", req.body);
        console.log("Uploaded Files:", newFiles);

        const lesson = await Lesson.findById(lessonId).populate("course");
        if (!lesson) {
            res.status(400).json({ message: "Lesson not found" });
            return;
        }
        console.log("Lesson Course ID:", lesson.course);

        //const course = await Course.findById(lesson.course).populate("instructor");
        const course = await Course.findById(lesson.course).populate<{
            instructor: { _id: mongoose.Types.ObjectId; username: string },
            courseId: string
        }>("instructor", "username _id courseId");

        console.log("Fetched Course:", course);

        if (!course) {
            res.status(404).json({ message: "Associated course not found" });
            return;
        }

        // console.log("Fetched Course:", course);

        const instructorUsername = course.instructor.username;
        const courseId = course.courseId;
        console.log("Final Course ID:", courseId);

        if (!courseId) {
            console.error(" Course ID is missing! Aborting file upload.");
            res.status(500).json({ message: "Course ID is missing!" });
            return;
        }

        const courseFolderPath = `/uploads/${instructorUsername}/courses/${courseId}/`;

        let updatedMaterials = [...lesson.materials];
        let filesToReplace = req.body.filesToReplace;
        filesToReplace = Array.isArray(filesToReplace) ? filesToReplace : filesToReplace ? [filesToReplace] : [];

        if (filesToReplace.length > 0) {
            filesToReplace.forEach((fileId: string) => {
                const objectIdToReplace = new mongoose.Types.ObjectId(fileId);
                const fileIndex = updatedMaterials.findIndex((material: any) => material._id.equals(objectIdToReplace));
                if (fileIndex !== -1) {
                    const filePath = path.join(__dirname, `../../${updatedMaterials[fileIndex].path}`);
                    console.log(` Attempting to delete: ${filePath}`); // Debug log

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted file: ${filePath}`);
                    } else {
                        console.warn(`File not found: ${filePath}`);
                    }
                    updatedMaterials.splice(fileIndex, 1);
                }
            });
        }
        if (newFiles && newFiles.length > 0) {
            newFiles.forEach(file => {
                updatedMaterials.push({
                    _id: new mongoose.Types.ObjectId(),
                    filename: file.filename,
                    path: `${courseFolderPath}${file.filename}`,
                    uploadedAt: new Date()
                });
            });
        }
        lesson.title = title || lesson.title;
        lesson.content = content || lesson.content;
        lesson.order = order || lesson.order;
        lesson.materials = updatedMaterials;
        await lesson.save();
        res.status(200).json({
            message: "Lesson updated successfully",
            lesson: {
                _id: lesson._id,
                title: lesson.title,
                content: lesson.content,
                order: lesson.order,
                materials: lesson.materials,
            }
        });
    } catch (error: any) {
        res.status(404).json({ message: "Error updating lesson ", error: error.message })
    }
}
//delete lesson instrcutor onl
export const deleteLesson = async (req: Request, res: Response) => {
    try {
        const { lessonId } = req.params;
        const instructorId = (req as any).user.userId;
        console.log("Received Request to Delete Lesson:", lessonId);

        const lesson = await Lesson.findById(lessonId).populate("course");
        console.log("Fetched Lesson:", lesson);
        console.log("Lesson Course ID:", lesson?.course);
        if (!lesson) {
            res.status(400).json({ message: "Lesson not Found" })
            return;
        }
        console.log("Fetched Lesson:", lesson);


        const course = await Course.findById(lesson.course).populate<{ instructor: { _id: mongoose.Types.ObjectId; username: string } }>("instructor", "username _id courseId");
        if (!course) {
            res.status(404).json({ message: "Associated course not found" });
            return;
        }

        console.log("Fetched Course:", course);

        if (!course.instructor._id.equals(new mongoose.Types.ObjectId(instructorId))) {
            res.status(403).json({ message: "You are not authorized to delete this lesson" });
            return;
        }
        console.log("Instructor Authorized:", course.instructor.username);

        const instructorUsername = course.instructor.username;
        const courseId = course.courseId;

        const courseFolderPath = path.join(__dirname, `../../uploads/${instructorUsername}courses/${courseId}/`);
        lesson.materials.forEach((material: any) => {
            const filePath = path.join(__dirname, `../../${material.path}`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file:${filePath}`)
            }
            else {
                console.log(`File not found:${filePath}`)
            }
        });
        await Lesson.findByIdAndDelete(lessonId);
        res.status(200).json({ message: "Lesson deleted successfully" })
    } catch (error: any) {
        res.status(500).json({ message: "Error deleting lesson", error: error.message })
        return;
    }
};
