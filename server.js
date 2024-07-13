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
      const token = jwt.sign({ userId: user._id, username: email.split('@')[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, username: email.split('@')[0] });
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
    
    const prompt = `Create a detailed business plan for a ${businessIdea} in ${location}. The plan should include the following sections with actionable and specific details:
    
1. Executive Summary: A concise summary of the business idea, mission statement, and business objectives.
2. Business Description: Details about the business, including its name, legal structure, and the nature of the business.
3. Products or Services: Detailed information about the products or services the business will offer, including features, benefits, and pricing.
4. Market Analysis: An analysis of the target market, including market size, trends, and competition.
5. Marketing and Sales Strategy: A detailed marketing strategy, sales strategy, and methods for attracting and retaining customers.
6. Operations Plan: An overview of the day-to-day operations, including location, facilities, equipment, and technology needed.
7. Management Team: Information about the management team, their roles, and relevant experience.
8. Financial Projections: Financial forecasts such as projected income statements, cash flow statements, and balance sheets for the next three to five years.
9. Funding Requirements: Details about the funding needed to start and run the business, including the amount, purpose, and potential sources of funding.
10. Legal and Regulatory Considerations: Information about any legal and regulatory requirements the business must comply with, including licenses, permits, and insurance.

Each section should be comprehensive, specific, and provide actionable content relevant to the business idea. Include realistic financial projections with numbers where applicable. Ensure that the plan is tailored to a ${businessIdea} in ${location}.`;

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
    
    const prompt = `Expand in detail on the section titled "${sectionTitle}" for a business plan of a ${businessIdea} in ${location}. Provide a comprehensive overview with specific and actionable content. Include financial projections with realistic numbers and detailed explanations of costs, revenues, and other financial considerations where relevant.`;

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

// Fetch username
app.get('/api/get-username', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ username: user.email.split('@')[0] });
  } catch (error) {
    handleApiError(res, error, 'Error fetching username');
  }
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
