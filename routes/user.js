import express from 'express';
import bcryt from 'bcrypt';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';
const router = express.Router();
import {User} from '../model/User.js';
import {OtpModel} from '../model/OtpModel.js';
import {UserData} from '../model/NumberModel.js';
import { createPdf, fetchPdf, sendPdf } from './pdfController.js'
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY || 'defaultSecretKey';


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const gmailUser = process.env.GMAIL_USER;
const gmailPassword = process.env.GMAIL_PASSWORD;

const twilioClient = new twilio(accountSid, authToken);




router.post('/createPdf',createPdf) // to generate pdf 

router.get('/fetchPdf',fetchPdf) // to fetch the generated pdf

router.post('/sendPdf',sendPdf) //sent pdf to mail 

//To Mobile Varifiacation

// Generate and send OTP using Twilio
router.post('/send-otp-number', async (req, res) => {
  const { mobileNumber } = req.body;

  // Generate OTP (You can use a library for this)
  const otp = otpGenerator.generate(6, { upperCaseAlphabets:false,lowerCaseAlphabets:false,specialChars:false });

  // Save user data to MongoDB
  try {
    await UserData.create({ mobileNumber, otp });
  } catch (error) {
    console.error('Error saving user data to MongoDB:', error);
    return res.json({ success: false, message: 'Failed to save user data' });
  }

  // Send OTP through Twilio
  try {
    await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioPhone,
      to: mobileNumber,
    });
  } catch (twilioError) {
    console.error('Error sending OTP via Twilio:', twilioError);
    return res.json({ success: false, message: 'Failed to send OTP' });
  }

  // Create a JWT token with the OTP
  const token = jwt.sign({ otp }, secretKey, { expiresIn: '1h' });

  res.json({ success: true, token });
});

// Verify OTP
router.post('/verify-otp-number', async (req, res) => {
  const { token, userEnteredOTP } = req.body;

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, secretKey);

    // Find user data in MongoDB based on mobile number
    const user = await UserData.findOne({ otp: decoded.otp });

    // Compare the OTP from the database with the user-entered OTP
    if (user && user.otp === userEnteredOTP) {
      res.json({ success: true, message: 'OTP verified successfully' });
    } else {
      res.json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    res.json({ success: false, message: 'Invalid token or expired OTP' });
  }
});






const otpStore = {};
// To Email Varification

// Generate OTP and store in MongoDB
// Generate OTP and store/update in MongoDB
router.post('/generate-otp-email', async (req, res) => {
  const { email } = req.body;
  const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });

  try {
    // Check if a document with the provided email already exists
    const existingOtpDoc = await OtpModel.findOne({ email });

    if (existingOtpDoc) {
      // If document exists, update the OTP
      existingOtpDoc.otp = otp;
      await existingOtpDoc.save();
    } else {
      // If document doesn't exist, create a new one
      await OtpModel.create({ email, otp });
    }

    // Send OTP to user's email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const mailOptions = {
      from: gmailUser,
      to: email,
      subject: 'Verification OTP',
      text: `Your OTP for email verification is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('Failed to send OTP');
      } else {
        res.status(200).send('OTP sent successfully');
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to generate OTP');
  }
});



// Verify OTP from MongoDB
router.post('/verify-otp-email', async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Retrieve stored OTP for the email from MongoDB
    const storedOtpDoc = await OtpModel.findOne({ email });

    if (storedOtpDoc && storedOtpDoc.otp === otp) {
      // Update user status in the database to mark email as verified (You can implement this part as needed)
      res.status(200).send('OTP verified successfully');
    } else {
      res.status(400).send('Invalid OTP');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error verifying OTP');
  }
});




router.post('/signup',async (req,res)=>{
    const { username, email, password,Bankname,number } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res.json({ message: "user already existed" });
  }

  const hashpassword = await bcryt.hash(password, 10);
  const newUser = new User({
    username,
    Bankname,
    email,
    number,
    password: hashpassword,
  });

  await newUser.save();
  return res.json({ status: true, message: "record registed" });
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ status: false, error: "User is not registered" });
  }

  const validPassword = await bcryt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ status: false, error: "Incorrect password" });
  }

  const token = jwt.sign({ username: user.username }, process.env.KEY, {
    expiresIn: "1h",
  });
  res.cookie("token", token, { httpOnly: true, maxAge: 360000 });
  return res.json({ status: true, message: "Login successfully" });
});


  router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: "user not registered" });
      }
      const token = jwt.sign({ id: user._id }, process.env.KEY, {
        expiresIn: "5m",
      });
  
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPassword,
        },
      });
      const encodedToken = encodeURIComponent(token).replace(/\./g, "%2E");
      var mailOptions = {
        from: gmailUser,
        to: email,
        subject: "Reset Password",
        text: `http://localhost:3000/resetPassword/${encodedToken}`,
      };
  
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return res.json({ message: "error sending email" });
        } else {
          return res.json({ status: true, message: "email sent" });
        }
      });
    } catch (err) {
      console.log(err);
    }
  });

  router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
      const decoded = await jwt.verify(token, process.env.KEY);
      const id = decoded.id;
      const hashPassword = await bcryt.hash(password, 10);
      await User.findByIdAndUpdate({ _id: id }, { password: hashPassword });
      return res.json({ status: true, message: "updated password" });
    } catch (err) {
      return res.json("invalid token");
    }
  });

  router.get("/getUser", async (req, res) => {
      try {
        const users=await User.find({});
        return res.json({status:true,users})
      } catch (error) {
        
      }
  });




  


export{router as UserRouter}