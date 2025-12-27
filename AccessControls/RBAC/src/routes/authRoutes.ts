import expres from "express";
import { Register } from "../contollers/authController";
import { Login } from "../contollers/authController";

const Router = expres.Router();

Router.post("/register", Register);

Router.post("/login", Login);

export default Router;
