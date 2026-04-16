const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

const checkAuth = require('../middleware/checkAuth');
const Fee = require('../model/Fee');
const Student = require('../model/Student');
const Course = require('../model/Course');

router.get('/fee/:feeId/pdf', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const fee = await Fee.findById(req.params.feeId);
    if (!fee) return res.status(404).json({ error: 'Fee not found' });
    if (fee.uId !== uId) return res.status(403).json({ error: 'Forbidden' });

    const [student, course] = await Promise.all([
      Student.findOne({ uId, phone: fee.phone, courseId: fee.courseId }),
      Course.findById(fee.courseId),
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="fee-receipt-${fee._id}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('FEE RECEIPT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt ID: ${fee._id}`);
    doc.text(`Date: ${new Date(fee.createdAt).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(12).text(`Student: ${student?.fullName || fee.fullName}`);
    doc.text(`Phone: ${fee.phone}`);
    doc.text(`Course: ${course?.courseName || fee.courseId}`);
    doc.moveDown();

    doc.fontSize(14).text(`Amount Paid: Rs ${fee.amount}`, { align: 'left' });
    doc.fontSize(12).text(`Remark: ${fee.remark}`);

    doc.moveDown(2);
    doc.text('Signature: ______________________', { align: 'right' });

    doc.end();
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;

