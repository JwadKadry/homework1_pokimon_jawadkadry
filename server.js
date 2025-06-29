const express = require('express');
const path = require('path');   
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')());
app.use(
  express.static(__dirname, {
    index: 'homepage.html'
  })
);

// Connect to MongoDB
mongoose.connect('mongodb+srv://JawadKadry:JwadKadry@pokmondb.z0c4hkx.mongodb.net/registerDB?retryWrites=true&w=majority&appName=PokmonDB')
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


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

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });

  const user = await User.findOne({ email: email.trim() });
  if (!user) 
    return res.status(401).json({ success: false, message: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ success: false, message: 'Invalid email or password' });

  // send back only needed fields
  res.json({
  success: true,
  user: { id: user._id, name: user.name, email: user.email }
});

});
// Start server
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

// קבלת מועדפים לפי מזהה משתמש
app.get('/users/:userId/favorites', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// הוספת פוקימון למועדפים
app.post('/users/:userId/favorites', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const exists = user.favorites.find(p => p.id === req.body.id);
    if (!exists) {
      user.favorites.push(req.body);
      await user.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// הסרת פוקימון מהמועדפים
app.delete('/users/:userId/favorites/:pokeId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.favorites = user.favorites.filter(p => p.id !== parseInt(req.params.pokeId));
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
