import express from "express";
import {
  deleteProject,
  getProjectById,
  getProjects,
  postProject,
  updateProject,
} from "../controller/ProjectController.js";

const router = express.Router();

router.get("/projects", getProjects);
router.get("/projects/:id", getProjectById);
router.post("/projects", postProject);
router.patch("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

export default router;
