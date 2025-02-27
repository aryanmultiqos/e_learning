import  express from "express";
import connectDB from "./config/db";
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes'
import profileRoutes from './routes/profileRoutes'
import courseRoutes from './routes/courseRoutes';
dotenv.config();

const app=express();

app.use(express.json());
connectDB();
app.use('/api/users',userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/profile',profileRoutes)
app.use('/uploads', express.static('uploads'));

  //server startying
  const PORT = process.env.port || 5000;
  app.listen(PORT,()=>{
    console.log(`Server is  running on port ${PORT}`)
  })