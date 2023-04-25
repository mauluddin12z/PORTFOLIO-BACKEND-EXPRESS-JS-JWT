import path from "path";
import fs from "fs";
import { Skills } from "../model/SkillModel.js";
import datetimenow from "../datetimeFormatter.js";

export const getSkills = async (req, res) => {
  try {
    const response = await Skills.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

export const getSkillById = async (req, res) => {
  try {
    const response = await Skills.findOne({
      where: {
        id: req.params.id,
      },
    });
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

export const postSkill = async (req, res) => {
  let fileName = "";
  const skill = req.body.skill;
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

    image.mv(`./public/uploads/skills/images/${fileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
    });
  }
  try {
    await Skills.create({
      skill: skill,
      image: fileName,
    });
    res.status(201).json({ msg: `Skill Created Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};

export const updateSkill = async (req, res) => {
  const getSkillById = await Skills.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!getSkillById)
    return res.status(404).json({ msg: "Skill data not found" });

  const skill = req.body.skill;
  let fileName = "";

  if (req.files == null) {
    fileName = getSkillById.image;
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
    const imageFilepath = `./public/uploads/skills/images/${getSkillById.image}`;
    if (getSkillById.image) {
      fs.unlinkSync(imageFilepath);
    }
    image.mv(`./public/uploads/skills/images/${fileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
    });
  }

  try {
    await Skills.update(
      {
        project_name: skill,
        image: fileName,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );
    res.status(200).json({ msg: `Skill updated Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};

export const deleteSkill = async (req, res) => {
  const getSkillById = await Skills.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!getSkillById)
    return res.status(404).json({ msg: "Skill data not found" });

  try {
    const imageFilepath = `./public/uploads/skills/images/${getSkillById.image}`;
    fs.unlinkSync(imageFilepath);
    await Skills.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ msg: `Skill deleted Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};
