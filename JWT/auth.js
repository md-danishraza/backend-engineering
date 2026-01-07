import jwt from "jsonwebtoken";

// saving in env
const ACCESS_SECRET = "sflsdfsdfsd";
const REFRESH_SECRET = "fs343sgsfsd";

// access token (short-lived)
export const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

//  refresh token (long-lived)
export const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
