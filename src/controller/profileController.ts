import { Request, Response } from 'express';
import Profile from '../models/profile';
import User from '../models/user';
import Course from '../models/course';


////fetching (gettting) profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const profile = await Profile.findOne({ user: studentId }).populate('user', 'username email');
        if (!profile) {
            res.status(400).json({ message: "Proile not found" })
            return;
        }
        res.status(200).json({ message: "Profile fetched sucessfullyy", profile })
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching profile" })
    }
};
//updating profile
export const updateProfile = async (req: Request, res: Response) => {
    try {

        const { studentId, bio, dob, address, phone, semester } = req.body;
        if (!studentId) {
            res.status(400).json({ message: "Student Id is required" })
            return
        }
        const updatedProfile = await Profile.findOneAndUpdate(
            { user: studentId },
            { bio, dob, address, phone, semester },
            { new: true }
        );
        if (!updatedProfile) {
            res.status(404).json({ message: "Profile not found" })
        }
        if (bio && dob && address && phone) {
            await User.findByIdAndUpdate(studentId, { isVerified: 1 });
        }
        res.status(200).json({ message: "profile Updated Sccesfullyu", profile: updatedProfile })
    } catch (error: any) {
        res.status(500).json({ message: "Error updating profile", error: error.message })
    }
};
//getting profile of instrcutor
export const getProfileInstructor = async (req: Request, res: Response) => {
    try {
        const { instructorId } = req.params;
        console.log("Fetching profile for instructor ID:", instructorId);

        const profile = await Profile.findOne({ user: instructorId }).populate('user', 'username email');

        if (!profile) {
            res.status(404).json({ message: "Profile not found" });
            return;
        }

        res.status(200).json({ message: "Profile fetched successfully", profile });

    } catch (err: any) {
        res.status(500).json({ message: "Error fetching profile", error: err.message });
    }
};
//upadting profile for instructor
export const updateProfileInstructor = async (req: Request, res: Response) => {
    try {
        const { instructorId, bio, dob, address, phone, qualification, experience, semester } = req.body;

        if (!instructorId) {
            res.status(400).json({ message: "Instructor ID is required" });
            return;
        }
        if (semester && (semester < 1 || semester > 6)) {
            res.status(400).json({ message: "Semester must be between 1 and 6" });
            return;
        }

        const updatedProfile = await Profile.findOneAndUpdate(
            { user: instructorId },
            { bio, dob, address, phone, qualification, experience, semester },
            { new: true }
        );

        if (!updatedProfile) {
            res.status(404).json({ message: "Profile not found" });
            return
        }
        console.log("Updating isVerified for Instructor:", instructorId);


        if (bio && dob && address && phone && qualification && experience && semester) {
            console.log("Marking instructor as verified...");
            const instructorUpdate = await User.findByIdAndUpdate(instructorId,
                { $set: { isVerified: 1 } },
                { new: true }
            );
            console.log("Instructor update result:", instructorUpdate);

            if (!instructorUpdate) {
                res.status(500).json({ message: "Error updating instructor verification status" });
                return;
            }

        }

        res.status(200).json({ message: "Profile updated successfully", profile: updatedProfile });

    } catch (error: any) {
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};

//update semester for instrcutor and  stduents
export const updateSemester = async function(req:any,res:any){
    try {
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const { semester } = req.body;
        if (userRole !== 'instructor' && userRole !== 'student') {
            res.status(403).json({ message: "Only student and instrcutor can update semester" })
            return;
        }
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const profile= await Profile.findOne({user:userId});
        if(!profile){
            res.status(404).json({message:"Profile not found"})
            return;
        }
        if(profile.semester===semester){    
            res.status(400).json({message:"You are alreday in the semseter"})
            return;
        }
        if(userRole==="student"){
            const enrolledCourses= await Course.find({students:userId});
            if(enrolledCourses.length>0){
                res.status(400).json({message:"you cannot change semseter while enrolled in course.Please de-enroll first"});
                return;
            }
        }
        if(userRole==="instructor"){
            if(user.is_ended===0){
                res.status(400).json({message:"You must end your courses before changing the semster"})
                return;
            }
        }
        profile.semester=semester;
        await profile.save();
        return res.status(200).json({message:"Semester Updated Succesfully",profile});

    }catch(error:any){
        res.status(500).json({message:"Error Updating Semester",error:error.message});
        
    }
};
