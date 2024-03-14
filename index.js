// oyqo ierg cspa xqmk

import express from 'express';
import dotenv from 'dotenv';
import { mongoose } from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();
import { UserRouter } from './routes/user.js';
import path from 'path';


const app =express();
app.use(express.json());
app.use(cors({
    origin:["http://localhost:3000"],
    credentials:true
}));


app.use(cookieParser())
app.use('/auth',UserRouter);

mongoose.connect(process.env.DB_URI);


app.listen(process.env.PORT,()=>{
    console.log("server is running")
});
