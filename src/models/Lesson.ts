import mongoose from "mongoose";   
interface IMaterial {
    _id: mongoose.Types.ObjectId;  
    filename: string;
    path: string;
    uploadedAt: Date;
} 
interface Ilesson extends Document{
    _id: mongoose.Types.ObjectId;
    title: string;
    content: string;
    course:mongoose.Schema.Types.ObjectId;
    materials:IMaterial[];
    status:'active' | 'inactive';
    order:number;
}
const lessonSchema= new mongoose.Schema<Ilesson>(
    {
        title:{type:String,required:true},
        content:{type:String,required:true},
        course:{type:mongoose.Schema.Types.ObjectId,ref:"Course",required:true},
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        materials:[
            {
                _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, 

                filename:{type:String,required:true},
                path:{type:String,required:true},
                uploadedAt:{type:Date,required:true}
                }
                ],
                order:{type:Number,required:true}
            },
            { timestamps: true }
        );
const Lesson=mongoose.model<Ilesson>("Lesson",lessonSchema);
export default Lesson;