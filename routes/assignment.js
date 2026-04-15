const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const checkAuth = require('../middleware/checkAuth');
const Assignment = require('../model/Assignment');
const Submission = require('../model/Submission');
const Student = require('../model/Student');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET_KEY,
});

function getPaging(req) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const skip = (page - 1) * limit;
  const q = (req.query.q || '').toString().trim();
  const sortBy = (req.query.sortBy || 'createdAt').toString();
  const order = (req.query.order || 'desc').toString().toLowerCase() === 'asc' ? 1 : -1;
  return { page, limit, skip, q, sortBy, order };
}

// ---------------------- ASSIGNMENT CRUD (Institute) ----------------------
router.post('/', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const { courseId, title, description, dueDate } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ error: 'courseId and title are required' });
    }

    const assignment = new Assignment({
      _id: new mongoose.Types.ObjectId(),
      uId,
      courseId,
      title,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    if (req.files && req.files.attachment) {
      const uploaded = await cloudinary.uploader.upload(req.files.attachment.tempFilePath, {
        folder: 'assignments',
      });
      assignment.attachmentUrl = uploaded.secure_url;
      assignment.attachmentId = uploaded.public_id;
    }

    await assignment.save();
    return res.status(201).json({ assignment });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

router.get('/', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const { page, limit, skip, q, sortBy, order } = getPaging(req);
    const courseId = (req.query.courseId || '').toString().trim();

    const allowedSort = new Set(['createdAt', 'title', 'dueDate']);
    const sortField = allowedSort.has(sortBy) ? sortBy : 'createdAt';

    const filter = { uId };
    if (courseId) filter.courseId = courseId;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Assignment.find(filter).sort({ [sortField]: order }).skip(skip).limit(limit),
      Assignment.countDocuments(filter),
    ]);

    return res.status(200).json({
      assignments: items,
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
        courseId: courseId || undefined,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

router.get('/:id', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.uId !== uId) return res.status(403).json({ error: 'Forbidden' });

    const submissions = await Submission.find({ uId, assignmentId: assignment._id.toString() }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ assignment, submissions });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.uId !== uId) return res.status(403).json({ error: 'Forbidden' });

    const { title, description, dueDate, courseId } = req.body;
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (courseId !== undefined) assignment.courseId = courseId;
    if (dueDate !== undefined) assignment.dueDate = dueDate ? new Date(dueDate) : undefined;

    if (req.files && req.files.attachment) {
      if (assignment.attachmentId) {
        await cloudinary.uploader.destroy(assignment.attachmentId);
      }
      const uploaded = await cloudinary.uploader.upload(req.files.attachment.tempFilePath, {
        folder: 'assignments',
      });
      assignment.attachmentUrl = uploaded.secure_url;
      assignment.attachmentId = uploaded.public_id;
    }

    await assignment.save();
    return res.status(200).json({ assignment });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const { uId } = req.user;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.uId !== uId) return res.status(403).json({ error: 'Forbidden' });

    if (assignment.attachmentId) {
      await cloudinary.uploader.destroy(assignment.attachmentId);
    }

    // remove submission files
    const subs = await Submission.find({ uId, assignmentId: assignment._id.toString() });
    for (const s of subs) {
      if (s.fileId) {
        // best-effort cleanup
        try { await cloudinary.uploader.destroy(s.fileId); } catch (_) {}
      }
    }
    await Submission.deleteMany({ uId, assignmentId: assignment._id.toString() });
    await Assignment.findByIdAndDelete(req.params.id);
    return res.status(200).json({ msg: 'deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// ---------------------- STUDENT SUBMISSION (public) ----------------------
// This is intentionally unauthenticated for demo purposes.
// In real systems you should authenticate students.
router.post('/:id/submit', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const { studentId, notes } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.courseId !== assignment.courseId) {
      return res.status(400).json({ error: 'Student is not enrolled in this assignment course' });
    }

    const submission = new Submission({
      _id: new mongoose.Types.ObjectId(),
      uId: assignment.uId,
      assignmentId: assignment._id.toString(),
      courseId: assignment.courseId,
      studentId: student._id.toString(),
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      notes: notes || '',
      status: 'submitted',
    });

    if (req.files && req.files.file) {
      const uploaded = await cloudinary.uploader.upload(req.files.file.tempFilePath, {
        folder: 'submissions',
        resource_type: 'auto',
      });
      submission.fileUrl = uploaded.secure_url;
      submission.fileId = uploaded.public_id;
    }

    await submission.save();
    return res.status(201).json({ submission });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;

