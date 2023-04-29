import express from "express";
import {
  Login,
  Logout,
  getUserById,
  getUsers,
  registerUser,
} from "../controller/UserController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { refreshToken } from "../controller/refreshToken.js";

const router = express.Router();

router.get("/users", verifyToken, getUsers);
router.get("/users/:id", getUserById);
router.post("/users", verifyToken, registerUser);
router.post("/login", Login);
router.get("/token", refreshToken);
router.delete("/logout", Logout);

export default router;
