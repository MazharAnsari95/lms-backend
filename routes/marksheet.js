const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

const checkAuth = require('../middleware/checkAuth');
const Marksheet = require('../model/Marksheet');
const Student = require('../model/Student');
const Course = require('../model/Course');

router.post('/', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const { courseId, studentId, examName, subjects, remark } = req.body;
    if (!courseId || !studentId || !examName || !Array.isArray(subjects)) {
      return res.status(400).json({ error: 'courseId, studentId, examName, subjects required' });
    }

    const doc = new Marksheet({
      _id: new mongoose.Types.ObjectId(),
      uId,
      courseId,
      studentId,
      examName,
      subjects,
      remark: remark || '',
    });
    await doc.save();
    return res.status(201).json({ marksheet: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

router.get('/student/:studentId', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const studentId = req.params.studentId;
    const courseId = (req.query.courseId || '').toString();
    const filter = { uId, studentId };
    if (courseId) filter.courseId = courseId;
    const items = await Marksheet.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ marksheets: items });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

router.get('/:id/pdf', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const ms = await Marksheet.findById(req.params.id);
    if (!ms) return res.status(404).json({ error: 'Not found' });
    if (ms.uId !== uId) return res.status(403).json({ error: 'Forbidden' });

    const [student, course] = await Promise.all([
      Student.findById(ms.studentId),
      Course.findById(ms.courseId),
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="marksheet-${ms._id}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('MARKSHEET', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Student: ${student?.fullName || ms.studentId}`);
    doc.text(`Course: ${course?.courseName || ms.courseId}`);
    doc.text(`Exam: ${ms.examName}`);
    doc.text(`Date: ${new Date(ms.createdAt).toLocaleString()}`);
    doc.moveDown();

    const tableTop = doc.y;
    doc.fontSize(12).text('Subject', 50, tableTop);
    doc.text('Marks', 300, tableTop);
    doc.text('Max', 420, tableTop);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    let total = 0;
    let maxTotal = 0;
    ms.subjects.forEach((s) => {
      doc.text(s.name, 50, doc.y);
      doc.text(String(s.marks), 300, doc.y);
      doc.text(String(s.maxMarks), 420, doc.y);
      doc.moveDown(0.5);
      total += Number(s.marks || 0);
      maxTotal += Number(s.maxMarks || 0);
    });

    doc.moveDown();
    doc.fontSize(12).text(`Total: ${total} / ${maxTotal}`);
    const percent = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(2) : '0.00';
    doc.text(`Percentage: ${percent}%`);
    if (ms.remark) doc.text(`Remark: ${ms.remark}`);

    doc.end();
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;

