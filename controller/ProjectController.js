import path from "path";
import fs from "fs";
import { Projects } from "../model/PorjectModel.js";
import datetimenow from "../datetimeFormatter.js";

export const getProjects = async (req, res) => {
  try {
    const response = await Projects.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

export const getProjectById = async (req, res) => {
  try {
    const response = await Projects.findOne({
      where: {
        id: req.params.id,
      },
    });
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

export const postProject = async (req, res) => {
  let fileName = "";
  const project_name = req.body.project_name;
  const project_link = req.body.project_link;
  if (req.files !== null) {
    const image = req.files.image;
    const fileSize = image.data.length;
    const maxFileSize = 50 * 1024 * 1024;
    const ext = path.extname(image.name);
    fileName = datetimenow() + image.md5 + ext;
    const allowedType = [".png", ".jpg", ".jpeg", ".pdf"];

    if (!allowedType.includes(ext.toLowerCase()))
      return res.status(422).json({ msg: "Invalid File" });
    if (fileSize > maxFileSize)
      return res.status(422).json({ msg: "Image must be less than 50 MB" });

    image.mv(`./public/uploads/projects/images/${fileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
    });
  }

  try {
    await Projects.create({
      project_name: project_name,
      project_link: project_link,
      image: fileName,
    });
    res.status(201).json({ msg: `Project Created Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};

export const updateProject = async (req, res) => {
  const getProjectById = await Projects.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!getProjectById)
    return res.status(404).json({ msg: "Project data not found" });

  const project_name = req.body.project_name;
  const project_link = req.body.projects_link;
  let fileName = "";

  if (req.files == null) {
    fileName = getProjectById.image;
  } else {
    const image = req.files.image;
    const fileSize = image.data.length;
    const maxFileSize = 50 * 1024 * 1024;
    const ext = path.extname(image.name);
    fileName = datetimenow() + image.md5 + ext;
    const allowedType = [".png", ".jpg", ".jpeg", ".pdf"];

    if (!allowedType.includes(ext.toLowerCase()))
      return res.status(422).json({ msg: "Invalid Images" });
    if (fileSize > maxFileSize)
      return res.status(422).json({ msg: "Image must be less than 50 MB" });
    const imageFilepath = `./public/uploads/projects/images/${getProjectById.image}`;
    if (getProjectById.image) {
      fs.unlinkSync(imageFilepath);
    }
    image.mv(`./public/uploads/projects/images/${fileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
    });
  }

  try {
    await Projects.update(
      {
        project_name: project_name,
        project_link: project_link,
        image: fileName,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    res.status(200).json({ msg: `Project updated Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};

export const deleteProject = async (req, res) => {
  const getProjectById = await Projects.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!getProjectById)
    return res.status(404).json({ msg: "Project data not found" });

  try {
    const imageFilepath = `./public/uploads/projects/images/${getProjectById.image}`;
    fs.unlinkSync(imageFilepath);
    await Projects.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ msg: `Project deleted Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};
