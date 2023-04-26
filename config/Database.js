import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import mysql2 from "mysql2";
dotenv.config();

const db = new Sequelize(process.env.MYSQL_NAME, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
  host: process.env.MYSQL_HOSTNAME,
  port: "3306",
  timezone: "+07:00",
  dialect: "mysql",
  dialectModule: mysql2,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export default db;