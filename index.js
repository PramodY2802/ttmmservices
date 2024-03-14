// oyqo ierg cspa xqmk

import express from 'express';
import dotenv from 'dotenv';
import { mongoose } from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();
import { UserRouter } from './routes/user.js';
import path from 'path';

const PORT=process.env.PORT || 8000;


const app =express();
app.use(express.json());

app.use(cors({
    origin:true,
    credentials:true
}));


app.use(cookieParser())
app.use('/auth',UserRouter);

mongoose.connect(process.env.DB_URI);


app.listen(PORT,()=>{
    console.log(`server is running ${PORT}`)
});

