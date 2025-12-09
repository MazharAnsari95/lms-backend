const express = require('express');
const app = express();
const userRoute = require('./routes/user');
const CourseRoute = require('./routes/course');
const studentRoute = require('./routes/student');
const feeRoute = require('./routes/fee');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const cors = require('cors')

// Connect to MongoDB
// mongoose.connect('mongodb://127.0.0.1:27017/Institute')
mongoose.connect(process.env.MONGO_URL)

    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Middleware
app.use(express.json());
app.use(cors());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
}));

// Routes
app.use('/user', userRoute);
app.use('/course', CourseRoute);
app.use('/student', studentRoute);
app.use('/fee', feeRoute);


// 404 route
app.use('/', (req, res) => {
    res.status(404).json({ msg: 'Bad request' });
});

module.exports = app;
