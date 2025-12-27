import expres from "express";
import { authMiddleware, authRoles } from "../middlewares/auth";

const Router = expres.Router();

// only admin can access
Router.get("/admin", authRoles("admin"), (req, res) => {
  res.status(200).json(`hello admin ${(req as any).user.name}`);
});
// only manager and admin can access
Router.get("/manager", authRoles("admin", "manager"), (req, res) => {
  res.status(200).json(`hello manager ${(req as any).user.name}`);
});
// all can access
Router.get("/user", authRoles("admin", "manager", "user"), (req, res) => {
  res.status(200).json(`hello user ${(req as any).user.name}`);
});

export default Router;
