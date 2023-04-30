import path from "path";
import fs from "fs";
import { Skills } from "../model/SkillModel.js";
import datetimenow from "../datetimeformatter.js";
import { google } from "googleapis";
import { Stream } from "stream";

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

const MY_IMAGE_FOLDER_PARENT_ID = "1z4GtzhH_5NQ7dRt09kRpF91BeYA5y9Z_";
const auth = new google.auth.GoogleAuth({
  keyFile: "./googleKey.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

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

    try {
      // Upload file to Google Drive
      const imageFileMetadata = {
        name: fileName,
        parents: [MY_IMAGE_FOLDER_PARENT_ID],
      };
      const imageMedia = {
        mimeType: image.mimetype,
        body: Stream.Readable.from(image.data),
      };

      await drive.files.create({
        requestBody: imageFileMetadata,
        media: imageMedia,
        fields: "id",
      });

      const imageQuery = `name='${fileName}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${fileName}' not found`);
      }
      const imageFileId = imageResponse.data.files[0].id;
      const imageUrl = `https://drive.google.com/uc?export=view&id=${imageFileId}`;

      await Skills.create({
        skill,
        image: fileName,
        imageUrl,
      });
      res.status(201).json({ msg: `Skill Created Successfully` });
    } catch (error) {
      console.log(error.message);
      return res
        .status(500)
        .json({ msg: "Failed to upload file to Google Drive" });
    }
  } else {
    return res.status(400).json({ msg: "No file uploaded" });
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
    try {
      await Skills.update(
        {
          skill,
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
    try {
      const imageQuery = `name='${getSkillById.image}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${getSkillById.image}' not found`);
      }
      const imageFileId = imageResponse.data.files[0].id;

      drive.files.delete({
        fileId: imageFileId,
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error.message);
    }
    try {
      const imageFileMetadata = {
        name: fileName,
        parents: [MY_IMAGE_FOLDER_PARENT_ID],
      };
      const imageMedia = {
        mimeType: image.mimetype,
        body: Stream.Readable.from(image.data),
      };

      await drive.files.create({
        requestBody: imageFileMetadata,
        media: imageMedia,
        fields: "id",
      });

      const imageQuery = `name='${fileName}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${fileName}' not found`);
      }
      const imageFileId = imageResponse.data.files[0].id;
      const imageUrl = `https://drive.google.com/uc?export=view&id=${imageFileId}`;
      await Skills.update(
        {
          skill,
          image: fileName,
          imageUrl,
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
    const imageQuery = `name='${getSkillById.image}' and mimeType contains 'image'`;
    const imageResponse = await drive.files.list({
      q: imageQuery,
      fields: "files(id)",
    });

    if (imageResponse.data.files.length === 0) {
      throw new Error(`File '${getSkillById.image}' not found`);
    }
    const imageFileId = imageResponse.data.files[0].id;

    drive.files.delete({
      fileId: imageFileId,
    });

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
