import { mongoose } from "mongoose";

const userSchema = new mongoose.Schema({
    mobileNumber: { type: String, required: true },
    otp: { type: String, required: true },
  });

  const User = mongoose.model('mobileOtp', userSchema);


export {User as UserData};