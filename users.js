const express = require('express');
const { userModel } = require('./model');
const app = express();
const { v4: uuidv4 } = require("uuid");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const http = require('http');
const WebSocket = require('ws');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


module.exports = {
    create: function (req, res, next) {
        // console.log("req", req)
        userModel.findOne(
            { email: req.body.email },
            function (err, userInfo) {
                if (!userInfo) {
                    const { name, email, mobileNumber, fileUpload, password } = req.body;

                    // Validate mobile number and email
                    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
                        return res.status(400).json({ error: 'Invalid mobile number' });
                    }

                    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
                        return res.status(400).json({ error: 'Invalid email address' });
                    }

                    // Generate mobile OTP
                    const mobileOTP = generateOTP(6)


                    function generateOTP(length) {
                        const digits = '0123456789';
                        let OTP = '';
                        for (let i = 0; i < length; i++) {
                            OTP += digits[Math.floor(Math.random() * 10)];
                        }
                        console.log("OTP", OTP)
                        return OTP;
                    }

                    // Store user details in database
                    const newUser = { name, email, mobileNumber, fileUpload, password, emailVerified: false, mobileVerified: false, mobileOTP };
                    // Save newUser to database (you'll need a database for this)

                    // Send verification email
                    sendVerificationEmail(email, mobileOTP);


                    // Function to send verification email
                    function sendVerificationEmail(email, otp) {
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'prakash001ayr@gmail.com', // Your Gmail email address
                                pass: 'Prakash@213', // Your Gmail password
                            },
                        });

                        const mailOptions = {
                            from: 'prakash001ayr@gmail.com',
                            to: email,
                            subject: 'Email Verification',
                            text: `Your verification code is: ${otp}`,
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.error('Error sending email:', error);
                            } else {
                                console.log('Email sent:', info.response);
                            }
                        });
                    }

                    // Function to send message to all WebSocket clients
                    function sendToAllClients(message) {
                        console.log("message", message)
                        wss.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(message);
                            }
                        });
                    }

                    // WebSocket connection
                    wss.on('connection', (ws) => {
                        console.log('WebSocket client connected');

                        ws.on('message', (message) => {
                            console.log('Received message:', message);
                        });

                        ws.send('Welcome to the WebSocket server');
                    });

                    newUser.cognitoSub = uuidv4();
                    userModel.create(newUser, function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            sendToAllClients('New user added');
                            res.status(200).send({ message: "User added successfully!!!" });
                        }


                    });
                } else {
                    res
                        .status(422)
                        .send({ message: "User already exists" });
                }
            }
        );
    },
    authenticate: function (req, res, next) {
        userModel.findOne({ mobileNumber: req.body.mobileNumber, password: req.body.password }, function (err, userInfo) {
            // console.log("user", userInfo);
            if (err) {
                next(err);
            } else {
                if (!userInfo) {
                    res.status(422).send({ message: "Invalid userName/password!!!" });

                } else if (userInfo && userInfo.emailVerified !== true && userInfo.mobileVerified !== true) {
                    res.status(422).send({ message: "Please verify the email and phone" });
                } else {
                    res.status(200)
                        .send({
                            message: "Loggedin succesfully!!!",
                        });
                }
            }
        });
    },
    updateById: function (req, res, next) {

        const { mobileNumber, otp } = req.body;
        let userQuery = {};
        userQuery.mobileNumber = mobileNumber;
        userModel.findOne(userQuery, function (err, usersInfo) {
            console.log(usersInfo, otp)
            if (otp == usersInfo.mobileOTP) {
                req.body.mobileVerified = true;
                req.body.emailVerified = true;
                userModel.findByIdAndUpdate({ _id: usersInfo._id }, req.body, function (err, userInfo) {
                    console.log(userInfo)
                    if (userInfo) {
                        res.status(200).json({ message: 'Mobile number and email verified successfully' });
                    } else {
                        res.status(400).json({ error: 'Invalid OTP' });
                    }
                });
            } else {
                res.status(400).json({ error: 'Invalid OTP' });
            }
        })



    }
};