const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const checkAuth = require('../middleware/checkAuth');
const Attendance = require('../model/Attendance');
const Student = require('../model/Student');

// Mark attendance for a course and date
// body: { courseId, date: "YYYY-MM-DD", entries: [{ studentId, status: "present"|"absent" }] }
router.post('/mark', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const { courseId, date, entries } = req.body;
    if (!courseId || !date || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'courseId, date, entries are required' });
    }

    const ops = entries.map((e) => ({
      updateOne: {
        filter: { uId, courseId, date, studentId: e.studentId },
        update: {
          $set: { status: e.status },
          $setOnInsert: { _id: new mongoose.Types.ObjectId() },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) await Attendance.bulkWrite(ops);
    return res.status(200).json({ msg: 'saved' });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// Get attendance for a course + date, plus student list to render UI
// query: courseId, date
router.get('/', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const courseId = (req.query.courseId || '').toString();
    const date = (req.query.date || '').toString();
    if (!courseId || !date) return res.status(400).json({ error: 'courseId and date are required' });

    const [students, records] = await Promise.all([
      Student.find({ uId, courseId }).select('_id fullName phone email imageUrl'),
      Attendance.find({ uId, courseId, date }),
    ]);

    const map = new Map(records.map((r) => [r.studentId, r.status]));
    return res.status(200).json({
      students,
      attendance: students.map((s) => ({
        studentId: s._id,
        status: map.get(s._id.toString()) || 'absent',
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;

