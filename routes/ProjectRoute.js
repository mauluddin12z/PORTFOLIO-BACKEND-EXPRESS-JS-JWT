import express from "express";
import {
  deleteProject,
  getProjectById,
  getProjects,
  postProject,
  updateProject,
} from "../controller/ProjectController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/projects", getProjects);
router.get("/projects/:id", getProjectById);
router.post("/projects", verifyToken, postProject);
router.patch("/projects/:id", verifyToken, updateProject);
router.delete("/projects/:id", verifyToken, deleteProject);

export default router;
