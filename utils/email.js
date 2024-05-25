const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1.创建SMTP传输器
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  //2.定义邮箱选项
  const mailOptions = {
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message // plain text body
    // html: '<b>Hello world?</b>' // html body
  };
  //   3.发送邮件
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
