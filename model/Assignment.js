const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    _id: mongoose.Types.ObjectId,
    uId: { type: String, required: true }, // institute user id (owner)
    courseId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: false },
    attachmentUrl: { type: String, required: false },
    attachmentId: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);

