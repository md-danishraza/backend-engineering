// userController.ts
import { Request, Response } from "express";
import * as userService from "./userService";

export const getProfile = async (req: Request, res: Response) => {
  try {
    // 1. Read from Request Context (set by middleware)
    const userId = req.context.userId;

    // 2. Call Service
    const data = await userService.getUserProfile(userId);

    // 3. Send HTTP Response
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
