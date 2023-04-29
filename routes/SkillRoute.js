import express from "express";
import {
  deleteSkill,
  getSkillById,
  getSkills,
  postSkill,
  updateSkill,
} from "../controller/SkillController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/skills", getSkills);
router.get("/skills/:id", getSkillById);
router.post("/skills", verifyToken, postSkill);
router.patch("/skills/:id", verifyToken, updateSkill);
router.delete("/skills/:id", verifyToken, deleteSkill);

export default router;
