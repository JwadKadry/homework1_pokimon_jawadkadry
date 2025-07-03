const express = require('express');
const path = require('path');   
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_secret_key'; // כדאי לשים ב־.env

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { index: 'homepage.html' }));

// Connect to MongoDB
mongoose.connect('mongodb+srv://bsharyamin:Basharyamin1@pokmondb.z0c4hkx.mongodb.net/registerDB?retryWrites=true&w=majority&appName=PokmonDB')
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 🔐 Registration ---
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    return res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- 🔐 Login ---
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- 🛡️ Auth Middleware ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(auth, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// --- ⭐ Favorites Routes ---
// --- 📥 קבלת מועדפים (חובה כדי שהדף favorite.html יעבוד) ---
/*app.get('/users/:userId/favorites', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    res.json(user.favorites || []);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});*/

// --- ⭐ Favorites Routes ---
// --- 📥 קבלת מועדפים (חובה כדי שהדף favorite.html יעבוד) ---
app.get('/users/:userId/favorites', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.favorites || []);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




// --- 📤 הורדת מועדפים כ-CSV ---
app.get('/users/:userId/favorites/download', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.favorites) {
      return res.status(404).json({ message: "לא נמצאו מועדפים" });
    }

    const favorites = user.favorites;

    const header = ['id', 'name', 'types', 'abilities'];
    const rows = favorites.map(p => [
      p.id,
      p.name,
      Array.isArray(p.types)
        ? p.types
            .filter(t => t && t.type && t.type.name)
            .map(t => t.type.name)
            .join(" | ")
        : "לא ידוע",
      Array.isArray(p.abilities)
        ? p.abilities
            .filter(a => a && a.ability && a.ability.name)
            .map(a => a.ability.name)
            .join(" | ")
        : "לא ידוע"
    ]);

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=favorites.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error("שגיאה בהורדת CSV:", err);
    res.status(500).json({ message: "שגיאת שרת" });
  }
});



// --- ➕ הוספת פוקימון למועדפים ---
app.post('/users/:userId/favorites', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const simplifiedPokemon = simplifyPokemonData(req.body);

    //console.log("📦 פוקימון מפושט:", simplifiedPokemon);

    const exists = user.favorites.find(p => p.id === simplifiedPokemon.id);
    if (!exists) {
      user.favorites.push(simplifiedPokemon);
      await user.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error adding to favorites:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// --- ❌ הסרת פוקימון מהמועדפים ---
app.delete('/users/:userId/favorites/:pokeId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    user.favorites = user.favorites.filter(p => p.id !== parseInt(req.params.pokeId));
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Error removing from favorites:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Start server
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));



// החזרת משתמש רנדומלי מתוך רשימת המחוברים (חוץ מהמזהה שקיבלנו)
app.get('/users/random-opponent/:id', async (req, res) => {
  const myId = req.params.id;

  try {
    const onlineUsers = await User.find({
      _id: { $ne: myId },
      online: true
    });

    if (onlineUsers.length === 0) {
      return res.status(404).json({ error: "לא נמצאו יריבים מחוברים כרגע" });
    }

    const randomOpponent = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];

    res.json({
      id: randomOpponent._id,
      name: randomOpponent.name,
      favorites: randomOpponent.favorites || []
    });
  } catch (err) {
    console.error("שגיאה במציאת יריב רנדומלי:", err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
});



// פונקציה לסינון נתוני פוקימון
function simplifyPokemonData(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    sprites: {
      front_default: pokemon.sprites?.front_default || ""
    },
    types: (pokemon.types || []).map(t => t.type?.name),
    abilities: (pokemon.abilities || []).map(a => a.ability?.name)
  };
}


