import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

// --- 1. Define the Schema (The Rules) ---
const UserSchema = z.object({
  // TRANSFORMATION: .trim() removes spaces
  // VALIDATION: .min(2) ensures it's not empty
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),

  // TRANSFORMATION: z.coerce.number() forces string "30" into number 30
  // VALIDATION: .min(18) ensures legal age
  age: z.coerce.number().min(18, "You must be at least 18 years old").max(120),

  // TRANSFORMATION: .toLowerCase() normalizes the email
  // VALIDATION: .email() checks regex format
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

// --- 2. The API Route ---
app.post("/register", (req, res) => {
  try {
    // A. Parse the Input (Runs Validation & Transformation)
    // If invalid, this line throws an error immediately.
    const cleanData = UserSchema.parse(req.body);

    // B. Business Logic (Only runs if data is perfect)
    console.log("Saving to DB:", cleanData);

    res.status(201).json({
      success: true,
      user: cleanData,
    });
  } catch (error) {
    // C. Error Handling
    if (error instanceof z.ZodError) {
      // Format the error nicely for the frontend
      const errorMessages = error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));
      return res.status(400).json({ errors: errorMessages });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
