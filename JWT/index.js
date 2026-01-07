import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "./auth.js";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cookieParser());

// test user DB
const users = [
  { id: 1, email: "test@example.com", password: bcrypt.hashSync("1234", 8) },
];

// Login route
// generating both refresh as well as access
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in HTTP-only cookie
  //   so that it can't be accessed by scripts
  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });
  //   access tokens are saved in browser storage
  res.json({ accessToken });
});

// Protected route
app.get("/profile", (req, res) => {
  // extracting token from auth header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ message: "Protected data", user });
  });
});

// Refresh route
app.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) {
      // Refresh token expired or invalid
      return res
        .status(403)
        .json({ message: "Session expired, please log in again" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
    });
    res.json({ accessToken: newAccessToken });
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
