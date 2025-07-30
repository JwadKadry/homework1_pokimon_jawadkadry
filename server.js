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
const JWT_SECRET = 'your_secret_key'; // Better to store in .env

// --- ✅ Function to simplify Pokémon data ---
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

// --- 📥 Get Favorites
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

// --- 📤 Download Favorites as CSV
app.get('/users/:userId/favorites/download', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.favorites) {
      return res.status(404).json({ message: "No favorites found" });
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
        : "Unknown",
      Array.isArray(p.abilities)
        ? p.abilities
            .filter(a => a && a.ability && a.ability.name)
            .map(a => a.ability.name)
            .join(" | ")
        : "Unknown"
    ]);

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=favorites.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error("CSV download error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- ➕ Add Pokémon to Favorites
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

// --- ❌ Remove Pokémon from Favorites
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

// --- 👥 Find Random Opponent
app.get('/users/random-opponent/:id', async (req, res) => {
  const myId = req.params.id;

  try {
    let candidates = await User.find({
      _id: { $ne: myId },
      online: true
    });

    if (candidates.length === 0) {
      candidates = await User.find({
        _id: { $ne: myId }
      });
    }

    if (candidates.length === 0) {
      return res.status(404).json({ error: "No opponents found" });
    }

    const randomOpponent = candidates[Math.floor(Math.random() * candidates.length)];

    res.json({
      id: randomOpponent._id,
      name: randomOpponent.name,
      favorites: randomOpponent.favorites || []
    });
  } catch (err) {
    console.error("Random opponent error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- 🤝 Random Player Battle
app.post('/arena/random-vs-player', async (req, res) => {
  try {
    const { userId, pokemon } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.favorites || user.favorites.length < 1) {
      return res.status(400).json({ message: "No favorites found" });
    }

    const candidates = user.favorites.filter(p => p.name !== pokemon.name);
    if (candidates.length === 0) {
      return res.status(400).json({ message: "No other Pokémon to choose as opponent." });
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
      opponentName: "Random Player"
    });

  } catch (err) {
    console.error("Battle error:", err);
    res.status(500).json({ message: "Server error during battle" });
  }
});

// --- 🤖 Battle vs Bot
app.post('/arena/vs-bot', async (req, res) => {
  try {
    const { userId, pokemon: userPoke } = req.body;

    if (!userPoke || !userPoke.id) {
      return res.status(400).json({ message: 'Choose a valid Pokémon for battle' });
    }

    const MAX_ID = 1010;
    const botId = Math.floor(Math.random() * MAX_ID) + 1;

    const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${botId}`);
    const botPoke = simplifyPokemonData(pokeRes.data);

    const score = p =>
      p.stats
        .filter(s => typeof s.base_stat === 'number')
        .reduce((sum, s) => sum + s.base_stat, 0);

    const yourScore     = score(userPoke);
    const opponentScore = score(botPoke);

    res.json({
      yourScore:     yourScore.toFixed(0),
      opponentScore: opponentScore.toFixed(0),
      winner:        yourScore >= opponentScore ? 'you' : 'bot',
      botPokemon:    botPoke,
      botName:       'Bot'
    });

  } catch (err) {
    console.error("❌ /arena/vs-bot error:", err);
    res.status(500).json({ message: 'Server error during bot battle' });
  }
});

// --- 🧮 Leaderboard
app.get('/arena/leaderboard', async (req, res) => {
  try {
    const users = await User.find({});

    const leaderboard = users.map(user => {
      const battles = user.battles || [];

      let wins = 0, draws = 0, losses = 0;

      battles.forEach(b => {
        if (b.result === 'win') wins++;
        else if (b.result === 'draw') draws++;
        else if (b.result === 'loss') losses++;
      });

      const points = wins * 3 + draws;
      const total = battles.length;
      const successRate = total > 0 ? (wins / total * 100).toFixed(2) : 0;

      return {
        name: user.name,
        points,
        battles: total,
        wins,
        draws,
        losses,
        successRate
      };
    });

    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.successRate - a.successRate;
    });

    res.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- ➕ Add Battle Record
app.post('/users/:id/add-battle', async (req, res) => {
  const { result, pokemonName, mode } = req.body;

  if (!["win", "draw", "loss"].includes(result)) {
    return res.status(400).json({ message: "Invalid result" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.battles.push({ result, pokemonName, mode });
    await user.save();

    res.json({ message: "Battle result added" });
  } catch (err) {
    console.error("Add battle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- 🕓 Get Battle History
app.get('/users/:id/battles', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.battles || []);
  } catch (err) {
    console.error("Get battles error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- 🚀 Start server
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
