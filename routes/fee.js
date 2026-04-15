const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Fee = require('../model/Fee');
const checkAuth = require('../middleware/checkAuth');
const mongoose = require('mongoose');
// fee
router.post('/add-fee', checkAuth, (req, res) => {
    const verify = req.user;

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
    const verify = req.user;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const q = (req.query.q || '').toString().trim();
    const sortBy = (req.query.sortBy || 'createdAt').toString();
    const order = (req.query.order || 'desc').toString().toLowerCase() === 'asc' ? 1 : -1;

    const allowedSort = new Set(['createdAt', 'amount', 'fullName', 'phone']);
    const sortField = allowedSort.has(sortBy) ? sortBy : 'createdAt';

    const filter = { uId: verify.uId };
    if (q) {
        filter.$or = [
            { fullName: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { remark: { $regex: q, $options: 'i' } },
        ];
    }

    Promise.all([
        Fee.find(filter)
            .sort({ [sortField]: order })
            .skip(skip)
            .limit(limit),
        Fee.countDocuments(filter),
    ])
        .then(([result, total]) => {
            res.status(200).json({
                paymentHistory: result,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                    q,
                    sortBy: sortField,
                    order: order === 1 ? 'asc' : 'desc',
                }
            })
        })
        .catch(err => res.status(500).json({ error: err }))
})
// get all payment for any students  in a course

router.get('/all-payment', checkAuth, (req, res) => {
    const verify = req.user;
    const courseId = (req.query.courseId || '').toString();
    const phone = (req.query.phone || '').toString();
    Fee.find({ uId: verify.uId, courseId, phone })
        .sort({ createdAt: -1 })
        .then(result => {
            res.status(200).json({
                fees: result
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})



module.exports = router;