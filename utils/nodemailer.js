const nodemailer = require('nodemailer');

const sendEmail = (email, subject, html) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME, // Placeholder, replace with secure retrieval
      pass: process.env.MAIL_PASSWORD, // Placeholder, replace with secure retrieval
    },
  });

  let mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: email,
    subject: subject,
    html: html,
  };

  transporter.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log('Error ' + err);
    } else {
      console.log('Email sent successfully');
    }
  });
};

module.exports = { sendEmail };
