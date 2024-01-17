// api/user.js

const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const tokenSecretKey = 'Lokesh@20041234!@#';
const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'lokeshnaidu2624@gmail.com',
    pass: 'kvypagqxnfsvwrir',
  },
};

const transporter = nodemailer.createTransport(emailConfig);

router.post('/signup', async (req, res) => {
    try {
      let { email, password } = req.body;
      email = email.trim();
      password = password.trim();
  
      if (email === "" || password === "") {
        return res.json({
          status: "FAILED",
          message: "Empty Input Fields!",
        });
      }
  
      if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.json({
          status: "FAILED",
          message: "Invalid Email Entered",
        });
      }
  
      if (password.length < 8) {
        return res.json({
          status: "FAILED",
          message: "Password is too Short",
        });
      }
  
      const existingUser = await User.findOne({ where: { email } });
  
      if (existingUser) {
        return res.json({
          status: "FAILED",
          message: "User with the provided email already exists",
        });
      }
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const newUser = await User.create({
        email,
        password: hashedPassword,
      });
  
      return res.json({
        status: "Success",
        message: "Signup Successful",
        data: newUser,
      });
    } catch (error) {
      console.error(error);
      return res.json({
        status: "FAILED",
        message: "An Error Occurred while processing the request!",
      });
    }
  });

  router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();
  
    if (email === "" || password === "") {
      return res.json({
        status: "FAILED",
        message: "Empty Credentials Supplied!",
      })
    } else {
      User.findAll({ where: { email } })
        .then(data => {
          if (data.length > 0) {
            const hashedPassword = data[0].password;
            bcrypt.compare(password, hashedPassword).then(result => {
              if (result) {
                res.json({
                  status: "Success",
                  message: "Signin Successful",
                  data: data
                })
              } else {
                res.json({
                  status: "FAILED",
                  message: "Invalid Password Entered!"
                })
              }
            })
              .catch(err => {
                res.json({
                  status: "FAILED",
                  message: "An Error Occurred While Comparing The Passwords"
                })
              })
  
          } else {
            res.json({
              status: "FAILED",
              message: "Invalid Credentials Entered!"
            })
          }
        }).catch(err => {
          res.json({
            status: "FAILED",
            message: "An Error Occurred While Checking For the Existing User"
          })
        })
    }
  });

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({
        status: 'FAILED',
        message: 'User with the provided email does not exist',
      });
    }

    // Generate and store the reset token with expiration time (e.g., 1 hour)
    const resetToken = jwt.sign({ id: user.id }, tokenSecretKey, { expiresIn: "1h" });
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour expiration
    await user.update({ resetToken, resetTokenExpiration });

    // Send the reset token to the user via email
    const mailOptions = {
      from: emailConfig.auth.user,
      to: user.email,
      subject: 'Password Reset Token',
      text: `Your password reset token is: ${resetToken}. It will expire in 1 hour.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.json({
          status: 'FAILED',
          message: 'Error sending reset token email',
        });
      } else {
        console.log('Email sent: ' + info.response);
        return res.json({
          status: 'Success',
          message: 'Password reset token sent successfully',
        });
      }
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: 'FAILED',
      message: 'An Error Occurred while processing the request!',
    });
  }
});

router.post('/reset-password', async (req, res) => {
    try {
      const { email, resetToken, newPassword } = req.body;
      const user = await User.findOne({ where: { email, resetToken } });
  
      if (!user || user.resetTokenExpiration < new Date()) {
        return res.json({
          status: 'FAILED',
          message: 'Invalid or expired reset token',
        });
      }
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      await user.update({ password: hashedPassword, resetToken: null, resetTokenExpiration: null });
  
      return res.json({
        status: 'Success',
        message: 'Password reset successful',
      });
    } catch (error) {
      console.error(error);
      return res.json({
        status: 'FAILED',
        message: 'An Error Occurred while processing the request!',
      });
    }
  });

module.exports = router;
