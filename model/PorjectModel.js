import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

export const Projects = db.define(
  "projects",
  {
    project_name: DataTypes.STRING,
    project_link: DataTypes.STRING,
    image: DataTypes.STRING,
  },
  {
    freezeTableName: true,
  }
);
