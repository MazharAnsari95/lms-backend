const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    _id: mongoose.Types.ObjectId,
    uId: { type: String, required: true }, // assignment owner (institute)
    assignmentId: { type: String, required: true },
    courseId: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: false },
    studentPhone: { type: String, required: false },
    notes: { type: String, default: '' },
    fileUrl: { type: String, required: false },
    fileId: { type: String, required: false },
    status: { type: String, default: 'submitted' }, // submitted | reviewed | rejected
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);

