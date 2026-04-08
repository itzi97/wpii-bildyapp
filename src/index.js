import app from './app.js'

// Default 3000 if port not specified
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
});
