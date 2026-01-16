const express = require("express");
const app = express();

app.get("/add", (req, res) => {
  const { a, b } = req.query;

  // Validation Logic
  if (!a || !b) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const numA = parseInt(a);
  const numB = parseInt(b);

  if (isNaN(numA) || isNaN(numB)) {
    return res.status(400).json({ error: "Inputs must be numbers" });
  }

  res.json({ result: numA + numB });
});

module.exports = app; // Export app for testing
