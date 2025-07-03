const mongoose = require('mongoose');

const pokemonSchema = new mongoose.Schema({
  id: Number,
  name: String,
  sprites: {
    front_default: String
  },
  types: [
    {
      type: {
        name: String
      }
    }
  ],
  abilities: [
    {
      ability: {
        name: String
      }
    }
  ],
  stats: [
    {
      base_stat: Number,
      stat: {
        name: String
      }
    }
  ]
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  favorites: { type: [pokemonSchema], default: [] }
});

module.exports = mongoose.model('User', userSchema, 'users');
