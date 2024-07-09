const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const Schema = mongoose.Schema;


const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
});
const UserModel = mongoose.model('User', userSchema);


const exerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, "Must include a userId"]
  },
  description: {
    type: String,
    required: [true, "Must include a description"]
  },
  duration: {
    type: Number,
    required: [true, "Must include a duration"]
  },
  date: {
    type: String,
    default: new Date().toDateString()
  }
})

const ExerciseModel = mongoose.model('Exercise', exerciseSchema);

// API endpoint for create new user 
app.post('/api/users', async (req, res) => {

  const userData = req.body;
  try {
    const user = await UserModel.create(userData)
    return res.status(201).json({
      "username": user.username,
      "_id": user._id
    })
  } catch (error) {
    res.status(500).json({
      "message": "Something went wrong!"
    })
  }

})

// API endpoint for add exercise to a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const _id = req.params._id;
    const findUser = await UserModel.findOne({ "_id": _id })

    if (!findUser) return res.status(404).json({
      "message": "User not found"
    })

    const { username } = findUser
    const { description, duration, date } = req.body;
    const newExercise = {
      "userId": _id,
      "date": date ? new Date(date).toDateString() : new Date().toDateString(),
      "duration": duration,
      "description": description,
    }
    const created = await ExerciseModel.create(newExercise);
    const exercise = {
      "username": username,
      "description": created.description,
      "duration": created.duration,
      "date": created.date,
      "_id": _id,
    }
    res.status(201).json(exercise);

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      "message": "Server error"
    })
  }

})

// API endpoint for get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await UserModel.find({})
    res.status(200).json(user)
  } catch (error) {
    res.status(400).json({
      message: "User retrive faild"
    })
  }
})

// API endpoint for get a user exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const _id = req.params._id;
    const { from, to, limit } = req.query

    const foundUser = await UserModel.findOne({
      "_id": _id
    })

    if (!foundUser) return res.status(404).json({ "message": `User with id ${_id} not found` })
    const { username } = foundUser;
    let exercises = await ExerciseModel.find({
      "userId": _id,
    });

    if (from) {
      const fromDate = new Date(from);
      exercises = exercises.filter(exercise => new Date(exercise.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      exercises = exercises.filter(exercise => new Date(exercise.date) <= toDate);
    }
    if (limit) {
      exercises = exercises.splice(0, Number(limit));
    }
    let count = exercises.length;

    const exercisesList = exercises.map(exercise => {
      return {
        "description": exercise.description,
        "duration": exercise.duration,
        "date": exercise.date
      }
    })
    return res.json({
      "username": username,
      "count": count,
      "_id": _id,
      "log": exercisesList
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      "message": "Server error"
    })
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
