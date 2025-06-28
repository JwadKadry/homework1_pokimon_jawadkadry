const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const User = require('./models/user');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));

// Connect to MongoDB
mongoose.connect(
  'mongodb+srv://bsharyamin:Basharyamin1@pokmondb.z0c4hkx.mongodb.net/registerDB?retryWrites=true&w=majority&appName=PokmonDB',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Registration route
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Check for missing fields
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already in use' });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    return res
      .status(201)
      .json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Server error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
