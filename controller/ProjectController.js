import path from "path";
import fs from "fs";
import { Projects } from "../model/PorjectModel.js";
import datetimenow from "../datetimeFormatter.js";
import { google } from "googleapis";
import { Stream } from "stream";

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

const MY_IMAGE_FOLDER_PARENT_ID = "1RI-N2AjY652mOTPh1qJ9o5B4H-DdxAKp";
const auth = new google.auth.GoogleAuth({
  keyFile: "./googleKey.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });
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

      await Projects.create({
        project_name,
        project_link,
        image: fileName,
        imageUrl,
      });
      res.status(201).json({ msg: `Project Created Successfully` });
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

export const updateProject = async (req, res) => {
  const getProjectById = await Projects.findOne({
    where: {
      id: req.params.id,
    },
  });
  res.status(200).json({ msg: `Skill updated Successfully` });
  if (!getProjectById)
    return res.status(404).json({ msg: "Project data not found" });

  const project_name = req.body.project_name;
  const project_link = req.body.project_link;
  let fileName = "";

  if (req.files == null) {
    try {
      await Projects.update(
        {
          project_name,
          project_link,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      );
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
      const imageQuery = `name='${getProjectById.image}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${getProjectById.image}' not found`);
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
      await Projects.update(
        {
          project_name,
          project_link,
          image: fileName,
          imageUrl,
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
    const imageQuery = `name='${getProjectById.image}' and mimeType contains 'image'`;
    const imageResponse = await drive.files.list({
      q: imageQuery,
      fields: "files(id)",
    });

    if (imageResponse.data.files.length === 0) {
      throw new Error(`File '${getProjectById.image}' not found`);
    }
    const imageFileId = imageResponse.data.files[0].id;

    drive.files.delete({
      fileId: imageFileId,
    });

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
