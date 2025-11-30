
// module.exports = router;
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const User = require('../model/User');
require('dotenv').config();
const bcryptjs=require('bcryptjs');
const jwt=require('jsonwebtoken'); 

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET_KEY
});

// Signup route
router.post('/signup', async (req, res) => {
    User.find({email:req.body.email})
    .then(User=>{
        if(User.length>0)
        {
            return res.status(500).json({
                error:"email already registration"
            })
        }
    })
    try {

        if (!req.files || !req.files.image) {
            return res.status(400).json({ msg: 'No image uploaded' });
        }

        const file = req.files.image;

        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'users'
        });

        bcryptjs.hash(req.body.password, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({
                    error: err
                });
            } else {
                const user = new User({
                    _id: new mongoose.Types.ObjectId,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hash,
                    imageUrl: result.secure_url,
                    imageId: result.public_id
                });

                user.save()
                    .then(result => {
                        res.status(201).json({
                            msg: "User registered successfully",
                            user: result
                        });
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        });
                    });
            }
        });

    } catch (err) {          
        res.status(500).json({ error: err });
    }
}); 
//login
router.post('/login',(req,res)=>{
User.find({email:req.body.email})
.then(User=>{
    
    if(User.length == 0)
    {
        return res.status(500).json({
            msg:"email not registered"
        })
    }
    bcryptjs.compare(req.body.password,User[0].password,(err,result)=>{
        
        if(!result)
        {
            return res.status(500).json({
                error:"password matching failled"
            })
        }
        const token=jwt.sign({
            email:User[0].email,
            firstName:User[0].firstName,
            lastName:User[0].lastName,
            uId:User[0]._id
            
        },
       process.env.JWT_SECRET, 
        {
            expiresIn:'565d'
        }
     );
     res.status(200).json({
        _id:User[0]._id,
        firstName:User[0].firstName,
        lastName:User[0].lastName,
        email:User[0].email,
        imageUrl:User[0].imageUrl,
        imageId:User[0].imageId,
        token:token
     })
    })
})
})          

module.exports = router;
