import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
const connectDB=async()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI as string)
        console.log(`MongoDb Connected : ${conn.connection.host}`);
    }catch(error){
        const err = error as any;  // Type-cast the error as 'any'
    console.error(`Error ${err.message}`);
    process.exit(1);
    }
};
 export default connectDB;