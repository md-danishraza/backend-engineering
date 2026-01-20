// showcase code

import requireAuth from "./middleware/auth";
import userController from "./controller/userController";
// index.ts
app.get("/profile", requireAuth, userController.getProfile);
