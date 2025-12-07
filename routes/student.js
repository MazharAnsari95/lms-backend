const express = require('express')
const router = express.Router()
const checkAuth = require('../middleware/checkAuth')
const Student = require('../model/Student')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2;
const Fee = require('../model/Fee');
const Course = require('../model/Course');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET_KEY
});



// add new Student
router.post('/add-student', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    cloudinary.uploader.upload(req.files.image.tempFilePath, (err, result) => {
        const newStudent = new Student({
            _id: new mongoose.Types.ObjectId,
            fullName: req.body.fullName,
            phone: req.body.phone,
            email: req.body.email,
            courseId: req.body.courseId,
            address: req.body.address,
            uId: verify.uId,
            imageUrl: result.secure_url,
            imageId: result.public_id

        })
        newStudent.save()
            .then(result => {
                res.status(201).json({
                    newStudent: result

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
// get all own  student
router.get('/all-student/', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    Student.find({ uId: verify.uId })
        .select('_id uId fullName phone email address courseId imageUrl imageId')
        .then(result => {
            res.status(200).json({
                // Student: result
                studentList: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

// get student-detail by Id ------ new added variable
router.get('/student-detail/:id', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    console.log(verify, token)
    Student.findById(req.params.id)

        .select('_id uId fullName phone email address courseId imageUrl imageId')
        .then(result => {
            Fee.find({ uId: verify.uId, courseId: result.courseId, phone: result.phone })
                .then(feedata => {
                    Course.findById(result.courseId)
                        .then(courseDetail => {
                            res.status(200).json({
                                studentDetail: result,
                                feeDetail: feedata,
                                courseDetail: courseDetail
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
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

// get own all students gor  a course
router.get('/all-student/:courseId', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    Student.find({ uId: verify.uId, courseId: req.params.courseId })
        .select('_id uId fullName phone email address courseId imageUrl imageId')
        .then(result => {
            res.status(200).json({
                // Student: result
                studentList: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

//delete student 
router.delete('/:id', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    Student.findById(req.params.id)
        .then(student => {

            if (student.uId == verify.uId) {

                Student.findByIdAndDelete(req.params.id)



                    .then(result => {
                        cloudinary.uploader.destroy(Student.imageId, (deletedImage) => {
                            res.status(200).json({
                                result: result
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
})
// update student
router.put('/:id', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    console.log("verify", verify.uId)
    console.log("verify", verify.uId)

    Student.findById(req.params.id)
        .then(student => {
            if (verify.uId != student.uId) {
                return res.status(500).json({
                    error: "you are  not eligible to update this data"
                })
            }
            if (req.files) {
                cloudinary.uploader.destroy(student.imageId, (deletedImage) => {
                    cloudinary.uploader.upload(req.files.image.tempFilePath, (err, result) => {
                        const newupdatedStudent = {

                            fullName: req.body.fullName,
                            phone: req.body.phone,
                            email: req.body.email,
                            courseId: req.body.courseId,
                            address: req.body.address,
                            uId: verify.uId,
                            imageUrl: result.secure_url,
                            imageId: result.public_id

                        }
                        Student.findByIdAndUpdate(req.params.id, newupdatedStudent, { new: true })
                            .then(data => {
                                res.status(200).json({
                                    updatedStudent: data
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
                    fullName: req.body.fullName,
                    phone: req.body.phone,
                    email: req.body.email,
                    courseId: req.body.courseId,
                    address: req.body.address,
                    uId: verify.uId,
                    imageUrl: student.imageUrl,
                    imageId: student.imageId
                }
                Student.findByIdAndUpdate(req.params.id, updatedData, { new: true })
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

// get  latest 5 course data 
router.get('/latest-student', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    Student.find({ uId: verify.uId })
        .sort({ $natural: -1 }).limit(5)
        .then(result => {
            res.status(200).json({
                student: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})
router.get('/latest-student', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    Course.find({ uId: verify.uId })
        .sort({ $natural: -1 }).limit(5)
        .then(result => {
            res.status(200).json({
                course: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

module.exports = router;