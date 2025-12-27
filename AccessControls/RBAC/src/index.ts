import { configDotenv } from "dotenv";
configDotenv();
import connectDB from "./config/dbConfig.js";
connectDB();
import express, { Request, Response } from "express";

// routes
import authRoutes from "./routes/authRoutes.js";

const app = express();

// middlewares
app.use(express.json());

// routes
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("hello from server!!");
});
app.get("/auth", authRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log("server is running on port 3000");
});
