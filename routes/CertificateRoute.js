import express from "express";
import {
  deleteCertificate,
  getCertificateById,
  getCertificates,
  postCertificate,
  updateCertificate,
} from "../controller/CertificateController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/certificates", getCertificates);
router.get("/certificates/:id", getCertificateById);
router.post("/certificates", verifyToken, postCertificate);
router.patch("/certificates/:id", verifyToken, updateCertificate);
router.delete("/certificates/:id", verifyToken, deleteCertificate);

export default router;
