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
router.post("/skills", postSkill);
router.patch("/skills/:id", updateSkill);
router.delete("/skills/:id", deleteSkill);

export default router;
