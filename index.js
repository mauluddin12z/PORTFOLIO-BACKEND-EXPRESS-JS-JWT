import express from "express";
import FileUpload from "express-fileupload";
import cors from "cors";
import ProductRoute from "./routes/ProjectRoute.js";
import CertificateRoute from "./routes/CertificateRoute.js";
import SkillRoute from "./routes/SkillRoute.js";
import UserRoute from "./routes/UserRoute.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "https://hidayatmauluddinportfolio.vercel.app",
    ],
  })
);
app.use(express.json());
app.use(FileUpload());
const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.use(
  "/uploads/certificates",
  express.static(path.join(__dirname, "uploads/certificates"))
);
app.use(
  "/uploads/projects",
  express.static(path.join(__dirname, "uploads/projects"))
);
app.use(
  "/uploads/skills",
  express.static(path.join(__dirname, "uploads/skills"))
);
app.use(ProductRoute);
app.use(CertificateRoute);
app.use(SkillRoute);
app.use(UserRoute);

app.listen(5000, () => console.log("Server Up and Running..."));
