import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

export const Skills = db.define(
  "skills",
  {
    skill: DataTypes.STRING,
    image: DataTypes.STRING,
  },
  {
    freezeTableName: true,
  }
);
