const express = require('express')
const router = express.Router()
const checkAuth = require('../middleware/checkAuth')
const Course = require('../model/Course')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2;
const Student = require('../model/Student')
const fee=require('../model/Fee')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET_KEY
});

// add new course
router.post('/add-course', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    cloudinary.uploader.upload(req.files.image.tempFilePath, (err, result) => {
        const newCourse = new Course({
            _id: new mongoose.Types.ObjectId,
            courseName: req.body.courseName,
            price: req.body.price,
            description: req.body.description,
            startingDate: req.body.startingDate,
            endDate: req.body.endDate,
            uId: verify.uId,
            imageUrl: result.secure_url,
            imageId: result.public_id

        })
        newCourse.save()
            .then(result => {
                res.status(201).json({
                    newCourse: result

                })
            })
            .catch(err => {
                console.log(err)
                res.status(500).json({
                    error: err
                })
            })
    })

})
// get all course 
router.get('/all-courses/', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    Course.find({ uId: verify.uId })
        // .select('_id uId courseName  description price startingDate endDate imageUrl imageId')
        .select('_id uId courseName description price startingDate endDate imageUrl imageId')

        .then(result => {
            res.status(200).json({
                courses: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

// get one course for  any user

router.get('/course-detail/:id', checkAuth, (req, res) => {


    Course.findById(req.params.id)
        .select('_id uId courseName  description price startingDate endDate imageUrl imageId')
        .then(result => {
            Student.find({ courseId: req.params.id })
                .then(student => {

                    res.status(200).json({

                        course: result,
                        studentList: student,
                    })

                })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})
// delete course
router.delete('/:id', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    Course.findById(req.params.id)
        .then(course => {

            if (course.uId == verify.uId) {
                // delete
                Course.findByIdAndDelete(req.params.id)

                    .then(result => {

                        cloudinary.uploader.destroy(course.imageId, (deletedImage) => {
                            Student.deleteMany({ courseId: req.params.id })
                                .then(data => {
                                    res.status(200).json({
                                        result: data
                                    })

                                })
                                .catch(err => {
                                    res.status(500).json({
                                        msg: err
                                    })
                                })

                        })
                    })
                    .catch(err => {
                        res.status(500).json({
                            msg: err
                        })
                    })
            }
            else {
                res.status(500).json({
                    msg: "bad request"
                })
            }
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
})
// update course
router.put('/:id', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    console.log(verify.uId)
    Course.findById(req.params.id)
        .then(course => {
            if (verify.uId != course.uId) {
                return res.status(500).json({
                    error: "you are  not eligible to update this data"
                })
            }
            if (req.files) {
                cloudinary.uploader.destroy(course.imageId, (deletedImage) => {
                    cloudinary.uploader.upload(req.files.image.tempFilePath, (err, result) => {
                        const newupdatedCourse = {

                            courseName: req.body.courseName,
                            price: req.body.price,
                            description: req.body.description,
                            startingDate: req.body.startingDate,
                            endDate: req.body.endDate,
                            uId: verify.uId,
                            imageUrl: result.secure_url,
                            imageId: result.public_id

                        }
                        Course.findByIdAndUpdate(req.params.id, newupdatedCourse, { new: true })
                            .then(data => {
                                res.status(200).json({
                                    updatedCourse: data
                                })
                            })
                            .catch(err => {
                                console.log(err)
                                res.status(500).json({
                                    error: err
                                })
                            })

                    })




                })
            }
            else {
                const updatedData = {
                    courseName: req.body.courseName,
                    price: req.body.price,
                    description: req.body.description,
                    startingDate: req.body.startingDate,
                    endDate: req.body.endDate,
                    uId: verify.uId,
                    imageUrl: course.imageUrl,
                    imageId: course.imageId
                }
                Course.findByIdAndUpdate(req.params.id, updatedData, { new: true })
                    .then(data => {
                        res.status(200).json({
                            updatedData: data
                        })
                    })
                    .catch(err => {
                        console.log(err)
                        res.status(500).json({
                            error: err
                        })
                    })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

// get latest 5 course data
router.get('/latest-student', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    Course.find({ uId: verify.uId })
        .sort({ $natural: -1 }).limit(5)
        .then(result => {
            res.status(200).json({
                courses: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

// home api
router.get('/home', checkAuth, async (req, res) => {
     console.log("home API HIT");
    try {
        const token = req.headers.authorization.split(" ")[1];
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        const newFees = await fee.find({ uId: verify.uId }).sort({ $natural: -1 }).limit(5)
        const newStudents = await Student.find({ uId: verify.uId }).sort({ $natural: -1 }).limit(5)
        const totalCourse = await Course.countDocuments({ uId: verify.uId })
        const totalStudent = await Student.countDocuments({ uId: verify.uId })
        const totalAmount= await fee.aggregate([
            {$match :{uId:verify.uId}},
            {$group:{_id:null,total:{$sum:"$amount"}}}
        ])
        res.status(200).json({
            fees: newFees,
            students: newStudents,
            totalCourse: totalCourse,
            totalStudent: totalStudent,
            totalAmount:totalAmount.length>0?totalAmount[0].total:0
        })

    }
    catch (err) {
        res.status(500).json({
            error: err
        })
    }
})

module.exports = router;