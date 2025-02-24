import mongoose, { Document, mongo } from "mongoose";
interface ICourse extends Document {
    title: string;
    description: string;
    instructor: mongoose.Schema.Types.ObjectId;
    students: mongoose.Schema.Types.ObjectId[];
    category: string;
    syllabus: string[];
    rating: number;
    semester:number;
    status:'active' | 'inactive';
}
const courseSchema = new mongoose.Schema<ICourse>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
    syllabus: [{ type: String }],
    rating: { type: Number, default: 0 },
    semester:{type:Number,required:true,min:1,max:6},
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });


const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;



// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2I0OGY0OTBkY2JlYWEzOTU1NzJlMzYiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTczOTk0MDE3OCwiZXhwIjoxNzM5OTUwOTc4fQ.7qe7un1Z6HYgdQaA_eGehIIzJa7fTAUIp4lcOQEH2GE-token student
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2I1NjBjNGJmYjBjNWQ4NzU2NmJlMzciLCJyb2xlIjoiaW5zdHJ1Y3RvciIsImlhdCI6MTczOTk0MDIzMCwiZXhwIjoxNzM5OTUxMDMwfQ.Fvc7nSXX6RKn9FrtHGxRWMORrCG_doZMSokML-token instrcutorLmVOnc