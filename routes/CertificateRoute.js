import express from "express";
import {
  deleteCertificate,
  getCertificateById,
  getCertificates,
  postCertificate,
  updateCertificate,
} from "../controller/CertificateController.js";

const router = express.Router();

router.get("/certificates", getCertificates);
router.get("/certificates/:id", getCertificateById);
router.post("/certificates", postCertificate);
router.patch("/certificates/:id", updateCertificate);
router.delete("/certificates/:id", deleteCertificate);

export default router;
