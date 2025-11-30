const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Fee = require('../model/Fee');
const checkAuth = require('../middleware/checkAuth');
const mongoose = require('mongoose');
// fee
router.post('/add-fee', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    const newFee = new Fee({
        _id: new mongoose.Types.ObjectId,
        fullName: req.body.fullName,
        phone: req.body.phone,
        courseId: req.body.courseId,
        uId: verify.uId,
        amount: req.body.amount,
        remark: req.body.remark

    })
    newFee.save()
        .then(result => {
            res.status(200).json({
                newFee: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})
// get all fee collection for any user
router.get('/payment-history', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    Fee.find({ uId: verify.uId })
        .then(result => {
            res.status(200).json({
                paymentHistory: result
            })
        })
        .catch(err => {
            
            res.status(500).json({
                error: err
            })
        })
})
// get all payment for any students  in a course

router.get('/all-payment', checkAuth, (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    Fee.find({uId:verify.uId,courseId:req.body.courseId,phone:req.body.phone})
    .then(result=>{
        res.status(500).json({
            fess: result
        })
    })
    .catch(err=>{
          
        res.status(500).json({
            error: err
        })
    })  
})



module.exports = router;