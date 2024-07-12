require('dotenv').config();
const express = require('express');
const path = require('path');
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const port = process.env.PORT || 3000;

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { businessIdea, location } = req.body;
    console.log(`Generating plan for ${businessIdea} in ${location}`);
    
    const prompt = `Create a comprehensive business plan for a ${businessIdea} in ${location}. Include sections on Executive Summary, Business Description, Products/Services, Market Analysis, Marketing Strategy, Operations Plan, Management Team, Financial Projections, Funding Requirements, and Legal Considerations.`;
    
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ businessPlan: completion.data.choices[0].message.content });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'An error occurred while generating the business plan' });
  }
});

app.post('/api/expand-section', async (req, res) => {
  try {
    const { businessIdea, location, sectionTitle } = req.body;
    console.log(`Expanding section ${sectionTitle} for ${businessIdea} in ${location}`);
    
    const prompt = `Provide detailed information for the "${sectionTitle}" section of a business plan for a ${businessIdea} in ${location}. Include specific examples, numerical estimates, and actionable advice.`;
    
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ expandedContent: completion.data.choices[0].message.content });
  } catch (error) {
    console.error('Error expanding section:', error);
    res.status(500).json({ error: 'An error occurred while expanding the section' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { question, context } = req.body;
    console.log(`Answering question: ${question}`);
    
    const prompt = `Given the following business plan context:\n\n${context}\n\nAnswer the following question:\n${question}`;
    
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ answer: completion.data.choices[0].message.content });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'An error occurred while processing your question' });
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
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
});