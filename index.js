require('dotenv').config();
const express = require('express');
const cors = require('cors');
const reminders = require('./routes/reminders');
require('./scheduler');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'Lendr backend running ✓' }));
app.use('/api/reminders', reminders);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Lendr backend on port ${PORT}`));
