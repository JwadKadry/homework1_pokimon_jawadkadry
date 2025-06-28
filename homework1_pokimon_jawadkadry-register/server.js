const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // מאפשר גישה לקבצי HTML/CSS/JS

// התחברות ל־MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/registerDB', {
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// סכימה ומודל
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// ראוט של הרשמה
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // בדיקה ששדות לא ריקים
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "שדות חובה חסרים" });
    }

    try {
        // בדיקה אם המשתמש כבר קיים לפי אימייל
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: "❌ אימייל כבר קיים" });
        }

        // הצפנת הסיסמה ושמירה במסד
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashed });
        await user.save();

        res.status(201).json({ success: true, message: "✅ הרשמה הצליחה" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "❌ שגיאת שרת" });
    }
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
