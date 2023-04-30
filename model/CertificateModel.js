import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

export const Certificates = db.define(
  "certificates",
  {
    certificate: DataTypes.STRING,
    image: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    pdf: DataTypes.STRING,
    pdfUrl: DataTypes.STRING,
  },
  {
    freezeTableName: true,
  }
);
