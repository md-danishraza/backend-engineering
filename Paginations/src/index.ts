import express, { Request, Response } from "express";

import { listProducts } from "./controllers/products.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get("/products", listProducts);

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
