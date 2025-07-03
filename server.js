const express = require('express');
const path = require('path');   
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_secret_key'; // כדאי לשים ב־.env

// --- ✅ פונקציה לסינון נתוני פוקימון ---
function simplifyPokemonData(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    sprites: {
      front_default: pokemon.sprites?.front_default || ""
    },
    types: (pokemon.types || []).map(t => {
      if (t?.type?.name) return { type: { name: t.type.name } };
      if (typeof t === "string") return { type: { name: t } };
      return null;
    }).filter(Boolean),
    abilities: (pokemon.abilities || []).map(a => {
      if (a?.ability?.name) return { ability: { name: a.ability.name } };
      if (typeof a === "string") return { ability: { name: a } };
      return null;
    }).filter(Boolean),
    stats: (pokemon.stats || []).map(stat => ({
      base_stat: stat.base_stat,
      stat: { name: stat.stat?.name || "Unknown" }
    }))
  };
}

// --- Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { index: 'homepage.html' }));

// --- Connect to MongoDB
mongoose.connect('mongodb+srv://bsharyamin:Basharyamin1@pokmondb.z0c4hkx.mongodb.net/registerDB?retryWrites=true&w=majority&appName=PokmonDB')
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 🔐 Registration
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

// --- 🔐 Login
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
    user.online = true;
    await user.save();
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
// --- 🔐 Logout
app.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { online: false });
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- 🛡 Auth Middleware
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

// --- 📥 קבלת מועדפים
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

// --- 📤 הורדת מועדפים כ-CSV
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

// --- ➕ הוספת פוקימון למועדפים
app.post('/users/:userId/favorites', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const simplifiedPokemon = simplifyPokemonData(req.body);

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

// --- ❌ הסרת פוקימון מהמועדפים
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

// --- 👥 מציאת יריב רנדומלי
// --- 👥 מציאת יריב רנדומלי
app.get('/users/random-opponent/:id', async (req, res) => {
  const myId = req.params.id;

  try {
    // קודם ננסה רק משתמשים שמסומנים כ־online
    let candidates = await User.find({
      _id: { $ne: myId },
      online: true
    });

    // אם אין כאלה, ניפול חזרה לכל משתמש אחר
    if (candidates.length === 0) {
      candidates = await User.find({
        _id: { $ne: myId }
      });
    }

    if (candidates.length === 0) {
      return res.status(404).json({ error: "לא נמצאו יריבים" });
    }

    const randomOpponent = candidates[Math.floor(Math.random() * candidates.length)];

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



app.post('/arena/random-vs-player', async (req, res) => {
  try {
    const { userId, pokemon } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.favorites || user.favorites.length < 1) {
      return res.status(400).json({ message: "לא נמצאו פייבוריטים" });
    }

    const candidates = user.favorites.filter(p => p.name !== pokemon.name);
    if (candidates.length === 0) {
      return res.status(400).json({ message: "אין פוקימונים נוספים כדי לבחור יריב." });
    }

    const opponentPokemon = candidates[Math.floor(Math.random() * candidates.length)];

    const getScore = (p) => {
      return (
        0.3 * (p.hp ?? 0) +
        0.4 * (p.attack ?? 0) +
        0.2 * (p.defense ?? 0) +
        0.1 * (p.speed ?? 0) +
        0.15 * (((p.specialAttack ?? 0) + (p.specialDefense ?? 0)) / 2)
      );
    };

    const yourScore = getScore(pokemon);
    const opponentScore = getScore(opponentPokemon);

    res.json({
      yourScore: yourScore.toFixed(2),
      opponentScore: opponentScore.toFixed(2),
      winner: yourScore >= opponentScore ? userId : "opponent",
      opponentPokemon: {
        id: opponentPokemon.id,
        name: opponentPokemon.name,
        stats: opponentPokemon.stats,
        sprites: opponentPokemon.sprites
      },
      opponentName: "שחקן רנדומלי"
    });

  } catch (err) {
    console.error("שגיאה בקרב:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
});


// --- 🤖 קרב מול בוט
app.post('/arena/vs-bot', async (req, res) => {
  try {
    const { userId, pokemon: userPoke } = req.body;

    // 1) sanity-check: user must have passed a valid favorite
    if (!userPoke || !userPoke.id) {
      return res.status(400).json({ message: 'בחר פוקימון תקין לקרב' });
    }

    // 2) pick a random Pokémon ID from the entire PokéAPI range
    //    (adjust MAX_ID if needed)
    const MAX_ID = 1010;
    const botId = Math.floor(Math.random() * MAX_ID) + 1;

    // 3) fetch its full data from PokéAPI
    const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${botId}`);
    const botPoke = simplifyPokemonData(pokeRes.data);

    // 4) score function (reuse your weights)
    const score = p =>
      p.stats
        .filter(s => typeof s.base_stat === 'number')
        .reduce((sum, s) => sum + s.base_stat, 0);

    const yourScore     = score(userPoke);
    const opponentScore = score(botPoke);

    // 5) send back everything the front-end needs
    res.json({
      yourScore:     yourScore.toFixed(0),
      opponentScore: opponentScore.toFixed(0),
      winner:        yourScore >= opponentScore ? 'you' : 'bot',
      botPokemon:    botPoke,
      botName:       'Bot'
    });

  } catch (err) {
    console.error("❌ /arena/vs-bot error:", err);
    res.status(500).json({ message: 'שגיאת שרת בקרב מול בוט' });
  }
});


// --- 🚀 Start server
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));