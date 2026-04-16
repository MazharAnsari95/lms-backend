const mongoose = require('mongoose');

const marksheetSchema = new mongoose.Schema(
  {
    _id: mongoose.Types.ObjectId,
    uId: { type: String, required: true }, // institute
    courseId: { type: String, required: true },
    studentId: { type: String, required: true },
    examName: { type: String, required: true }, // e.g. Midterm, Final
    subjects: [
      {
        name: { type: String, required: true },
        maxMarks: { type: Number, required: true },
        marks: { type: Number, required: true },
      },
    ],
    remark: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Marksheet', marksheetSchema);

