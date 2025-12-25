import { Request, Response } from "express";
import {
  getPaginatedProducts,
  getProductsCursor,
} from "../services/product.service.js";

export const listProducts = async (req: Request, res: Response) => {
  try {
    // 1. Parsing
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // 2. Validate
    if (page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive numbers" });
    }
    if (limit > 50) {
      return res.status(400).json({ error: "limit must be less than 50" });
    }

    // 3. Call the service
    const result = await getPaginatedProducts(page, limit);

    // 4. Send Response
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Handler for Cursor-Based (Infinite)
export const listProductsInfinite = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

    const result = await getProductsCursor(limit, cursor);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};
