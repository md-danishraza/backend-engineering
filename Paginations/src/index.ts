import express, { Request, Response } from "express";

import { listProducts, listProductsInfinite } from "./controllers/products.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
// page based
app.get("/products", listProducts);
// cursor based
app.get("/products/infinite", listProductsInfinite);

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
