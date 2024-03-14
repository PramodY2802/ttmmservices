import pdf from 'html-pdf';
import path from 'path';
import nodemailer from 'nodemailer';
import fs from 'fs';
import pdfTemplate from '../documents/document.js';
import env from 'dotenv';
import { fileURLToPath } from 'url'; 
env.config();

export const createPdf = (req, res) => {
  pdf.create(pdfTemplate(req.body), {}).toFile('invoice.pdf', (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error generating PDF');
    } else {
      console.log(result);
      res.status(200).send('PDF generated');
    }
  });
};

// export const fetchPdf = (req, res) => {
//     const __filename = new URL(import.meta.url).pathname;
//     const __dirname = path.dirname(__filename);

//     // Assuming 'invoice.pdf' is in the same directory as this server file
//     const filePath = path.join(__dirname, 'invoice.pdf');
//     res.sendFile(filePath);
// };

export const fetchPdf = (req, res) => {
  // Use fileURLToPath to convert import.meta.url to a file path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const filePath = path.join(__dirname,'..', 'invoice.pdf');
  res.sendFile(filePath);
};

export const sendPdf = (req, res) => {
  // Use fileURLToPath to convert import.meta.url to a file path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const pathToAttachment = path.join(__dirname,'..', 'invoice.pdf');
  const attachment = fs.readFileSync(pathToAttachment).toString('base64');

  const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pramodyadav3142@gmail.com',
      pass: 'oyqoiergcspaxqmk',
    },
  });

  smtpTransport.sendMail(
    {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: 'Pdf Generate document',
      html: 'Testing Pdf Generate document, Thanks.',
      attachments: [
        {
          content: attachment,
          filename: 'invoice.pdf',
          encoding: 'base64',
        },
      ],
    },
    (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error sending email');
      } else {
        console.log(info);
        res.status(200).send('Mail has been sent to your email. Check your mail');
      }
    }
  );
};