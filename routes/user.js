
// // module.exports = router;
// const express = require('express');
// const router = express.Router();
// const cloudinary = require('cloudinary').v2;
// const mongoose = require('mongoose');
// const User = require('../model/User');
// require('dotenv').config();
// const bcryptjs = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// // Cloudinary config
// cloudinary.config({
//     cloud_name: process.env.CLOUD_NAME,
//     api_key: process.env.API_KEY,
//     api_secret: process.env.API_SECRET_KEY
// });

// // Signup route
// router.post('/signup', async (req, res) => {
//     User.find({ email: req.body.email })
//         .then(User => {
//             if (User.length > 0) {
//                 return res.status(500).json({
//                     error: "email already registration"
//                 })
//             }
//         })
//     try {

//         if (!req.files || !req.files.image) {
//             return res.status(400).json({ msg: 'No image uploaded' });
//         }

//         const file = req.files.image;

//         const result = await cloudinary.uploader.upload(file.tempFilePath, {
//             folder: 'users'
//         });

//         bcryptjs.hash(req.body.password, 10, (err, hash) => {
//             if (err) {
//                 return res.status(500).json({
//                     error: err
//                 });
//             } else {
//                 const user = new User({
//                     _id: new mongoose.Types.ObjectId,
//                     fullName: req.body.fullName,
//                     email: req.body.email,
//                     phone: req.body.phone,
//                     password: hash,
//                     imageUrl: result.secure_url,
//                     imageId: result.public_id
//                 });

//                 // User.save()
//                 //     .then(result => {
//                 //         res.status(200).json({
//                 //             msg: "User registered successfully",
//                 //             newUser: result
//                 //         });
//                 //     })
//                 //     .catch(err => {
//                 //         res.status(500).json({
//                 //             error: err
//                 //         });
//                 //     });
//                 user.save()
//                     .then(result => {
//                         res.status(200).json({
//                             msg: "User registered successfully",
//                             newUser: result
//                         });
//                     })
//                     .catch(err => {
//                         res.status(500).json({
//                             error: err
//                         });
//                     });

//             }
//         });

//     } catch (err) {
//         res.status(500).json({ error: err });
//     }
// });
// //login
// router.post('/login', (req, res) => {
//     User.find({ email: req.body.email })
//         .then(User => {

//             if (User.length == 0) {
//                 return res.status(500).json({
//                     msg: "email not registered"
//                 })
//             }
//             bcryptjs.compare(req.body.password, User[0].password, (err, result) => {

//                 if (!result) {
//                     return res.status(500).json({
//                         error: "password matching failled"
//                     })
//                 }
//                 const token = jwt.sign({
//                     fullName: User[0].fullName,
//                     email: User[0].email,
//                     phone: User[0].phone,
//                     uId: User[0]._id

//                 },
//                     process.env.JWT_SECRET,
//                     {
//                         expiresIn: '565d'
//                     }
//                 );
//                 res.status(200).json({
//                     _id: User[0]._id,
//                     fullName: User[0].fullName,
//                     email: User[0].email,
//                     phone: User[0].phone,
//                     imageUrl: User[0].imageUrl,
//                     imageId: User[0].imageId,
//                     token: token
//                 })
//             })
//         })
// })

// module.exports = router;

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const User = require('../model/User');
require('dotenv').config();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.CLOUD_SECRET
});

// ================= SIGNUP ==================
router.post('/signup', async (req, res) => {
  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 2. Check if image uploaded
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const file = req.files.image;

    // 3. Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'users',
    });

    // 4. Hash password
    const hashedPassword = await bcryptjs.hash(req.body.password, 10);

    // 5. Create new user
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      imageUrl: result.secure_url,
      imageId: result.public_id,
    });

    // 6. Save user
    await newUser.save();

    // 7. Send response
    return res.status(201).json({
      msg: "User registered successfully",
      user: newUser
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// ================= LOGIN ==================
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ error: "Email not registered" });
    }

    const isMatch = await bcryptjs.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Password incorrect" });
    }

    // Generate JWT token
    const token = jwt.sign({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      uId: user._id
    }, process.env.JWT_SECRET, { expiresIn: '30d' });

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      imageUrl: user.imageUrl,
      imageId: user.imageId,
      token
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
