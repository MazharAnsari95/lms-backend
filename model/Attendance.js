const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    _id: mongoose.Types.ObjectId,
    uId: { type: String, required: true }, // institute
    courseId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    studentId: { type: String, required: true },
    status: { type: String, required: true }, // present | absent
  },
  { timestamps: true }
);

attendanceSchema.index({ uId: 1, courseId: 1, date: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

