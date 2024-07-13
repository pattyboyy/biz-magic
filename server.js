require('dotenv').config();
const express = require('express');
const path = require('path');
const { Configuration, OpenAIApi } = require("openai");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User model
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Error handling function
function handleApiError(res, error, customMessage) {
  console.error(customMessage, error);
  const statusCode = error.response?.status || 500;
  const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
  res.status(statusCode).json({ error: customMessage, details: errorMessage });
}

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    handleApiError(res, error, 'Error registering user');
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    handleApiError(res, error, 'Error logging in');
  }
});

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.user.userId });
});

// Generate business plan (protected route)
app.post('/api/generate-plan', authenticateToken, async (req, res) => {
  try {
    const { businessIdea, location } = req.body;
    console.log(`Generating plan for ${businessIdea} in ${location}`);
    
    const prompt = `Create a comprehensive business plan for a ${businessIdea} in ${location}. Include 10 unique and distinct sections that cover every angle of starting up this business. Each section should have a title and a brief overview. Here are the sections:

1. Executive Summary
2. Business Description
3. Products or Services
4. Market Analysis
5. Marketing and Sales Strategy
6. Operations Plan
7. Management Team
8. Financial Projections
9. Funding Requirements
10. Legal and Regulatory Considerations

For each section, provide a title and a brief overview. Ensure each section starts with its number and title on a new line.`;
    
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI API response:', completion.data);

    res.json({ businessPlan: completion.data.choices[0].message.content });
  } catch (error) {
    handleApiError(res, error, 'Error generating business plan');
  }
});

// Expand section (protected route)
app.post('/api/expand-section', authenticateToken, async (req, res) => {
  try {
    const { sectionTitle, businessIdea, location } = req.body;
    console.log(`Expanding section: ${sectionTitle} for ${businessIdea} in ${location}`);
    
    const prompt = `Expand in detail on the section titled "${sectionTitle}" for a business plan of a ${businessIdea} in ${location}. Provide a comprehensive overview.`;
    
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI API response:', completion.data);

    res.json({ expandedContent: completion.data.choices[0].message.content });
  } catch (error) {
    handleApiError(res, error, 'Error expanding section');
  }
});

// Chat (protected route)
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { question, context } = req.body;
    console.log(`Answering question: ${question}`);
    
    const prompt = `Given the following business plan context:\n\n${context}\n\nAnswer the following question:\n${question}\n\nProvide a detailed and helpful response, using specific information from the business plan where relevant.`;
    
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI API response:', completion.data);

    res.json({ answer: completion.data.choices[0].message.content });
  } catch (error) {
    handleApiError(res, error, 'Error processing chat question');
  }
});

// Trending business ideas
app.get('/api/trending-ideas', async (req, res) => {
  try {
    // This is a placeholder. In a real application, you might fetch this data from another API or database
    const trendingIdeas = [
      "Eco-friendly Product Store",
      "Virtual Reality Arcade",
      "Artisanal Coffee Roastery",
      "Tech Education for Seniors",
      "Personalized Nutrition Plans"
    ];
    res.json({ trendingIdeas });
  } catch (error) {
    handleApiError(res, error, 'Error fetching trending ideas');
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
});
