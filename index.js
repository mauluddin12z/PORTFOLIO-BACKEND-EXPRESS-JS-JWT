import express from "express";
import FileUpload from "express-fileupload";
import cors from "cors";
import ProductRoute from "./routes/ProjectRoute.js";
import CertificateRoute from "./routes/CertificateRoute.js";
import SkillRoute from "./routes/SkillRoute.js";
import UserRoute from "./routes/UserRoute.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

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
app.use(ProductRoute);
app.use(CertificateRoute);
app.use(SkillRoute);
app.use(UserRoute);
app.listen(5000, () => console.log("Server Up and Running..."));
