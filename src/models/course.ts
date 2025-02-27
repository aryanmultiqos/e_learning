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
    materials: {
        filename: string;
        path: string;
        uploadedAt: Date;
    }[];
    status:'active' | 'inactive';
    courseId:String
    added_by:{
        createdBy:"admin"|"instructor";
        adminId:mongoose.Schema.Types.ObjectId;
        Id:mongoose.Schema.Types.ObjectId;
    };
   
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
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    added_by:{
        createdBy:{type:String,enum:["admin","instructor"],required:true},
        Id:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}
    },
    materials: [
        {
          filename: { type: String, required: true },
          path: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now }
        }
      ],
    courseId:{type:String,required:true}
}, { timestamps: true });


const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;
