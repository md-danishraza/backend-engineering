// app.js
const express = require("express");
const app = express();
app.use(express.json());

// temp Database
const products = [];

// not found product for get request
app.get("/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

app.post("/products", (req, res) => {
  // for second test
  if (req.body.price < 0) {
    return res.status(400).json({ error: "Price must be positive" });
  }

  const newProduct = {
    id: products.length + 1,
    name: req.body.name,
    price: req.body.price,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

module.exports = app;
