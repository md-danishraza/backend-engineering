import { Schema, model } from "mongoose";

enum Roles {
  User = "user",
  Manager = "manager",
  Admin = "admin",
}

interface User {
  name: string;
  email: string;
  password: string;
  role: Roles;
}

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ["user", "manager", "admin"] },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
