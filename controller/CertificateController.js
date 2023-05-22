import { Certificates } from "../model/CertificateModel.js";
import path from "path";
import fs from "fs";
import datetimenow from "../datetimeFormatter.js";
import { google } from "googleapis";
import { Stream } from "stream";
import dotenv from "dotenv"
dotenv.config()

export const getCertificates = async (req, res) => {
  try {
    const response = await Certificates.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

export const getCertificateById = async (req, res) => {
  try {
    const response = await Certificates.findOne({
      where: {
        id: req.params.id,
      },
    });
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

const MY_IMAGE_FOLDER_PARENT_ID = "1sv4D23ka74mdiNeho-m5ZvX1pnruN_VN";
const MY_PDF_FOLDER_PARENT_ID = "1BgRtDP88gGG7hPEHJ3SopNt1f8_dPTgr";
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });
export const postCertificate = async (req, res) => {
  const certificate = req.body.certificate;
  const image = req.files.image;
  const pdf = req.files.pdf;
  const pdfFileSize = pdf.data.length;
  const imageFileSize = image.data.length;
  const maxFileSize = 50 * 1024 * 1024;
  const pdfExt = path.extname(pdf.name);
  const imageExt = path.extname(image.name);
  const pdfFileName = datetimenow() + pdf.md5 + pdfExt;
  const imageFileName = datetimenow() + image.md5 + imageExt;
  const allowedType = [".png", ".jpg", ".jpeg", ".pdf"];

  if (!allowedType.includes(imageExt.toLowerCase()))
    return res.status(422).json({ msg: "Invalid File" });
  if (pdfFileSize > maxFileSize)
    return res.status(422).json({ msg: "PDF must be less than 50 MB" });
  if (imageFileSize > maxFileSize)
    return res.status(422).json({ msg: "Image must be less than 50 MB" });

  try {
    //IMAGE
    const imageFileMetadata = {
      name: imageFileName,
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

    const imageQuery = `name='${imageFileName}' and mimeType contains 'image'`;
    const imageResponse = await drive.files.list({
      q: imageQuery,
      fields: "files(id)",
    });

    if (imageResponse.data.files.length === 0) {
      throw new Error(`File '${imageFileName}' not found`);
    }
    const imageFileId = imageResponse.data.files[0].id;
    const imageUrl = `https://drive.google.com/uc?export=view&id=${imageFileId}`;

    //PDF
    const pdfFileMetadata = {
      name: pdfFileName,
      parents: [MY_PDF_FOLDER_PARENT_ID],
    };
    const pdfMedia = {
      mimeType: pdf.mimetype,
      body: Stream.Readable.from(pdf.data),
    };
    await drive.files.create({
      requestBody: pdfFileMetadata,
      media: pdfMedia,
      fields: "id",
    });
    const pdfQuery = `name='${pdfFileName}' and mimeType contains 'pdf'`;
    const pdfResponse = await drive.files.list({
      q: pdfQuery,
      fields: "files(id)",
    });
    if (pdfResponse.data.files.length === 0) {
      throw new Error(`File '${pdfFileName}' not found`);
    }
    const pdfFileId = pdfResponse.data.files[0].id;
    const pdfUrl = `https://drive.google.com/uc?export=view&id=${pdfFileId}`;

    await Certificates.create({
      certificate: certificate.toUpperCase(),
      image: imageFileName,
      imageUrl,
      pdf: pdfFileName,
      pdfUrl,
    });
    res.status(201).json({ msg: `Certificate Created Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};

export const updateCertificate = async (req, res) => {
  const getCertificateById = await Certificates.findOne({
    where: {
      id: req.params.id,
    },
  });

  if (!getCertificateById)
    return res.status(404).json({ msg: "Certificate data not found" });

  const certificate = req.body.certificate;
  let imageFileName = "";
  let pdfFileName = "";

  if (req.files == null) {
    imageFileName = getCertificateById.image;
    pdfFileName = getCertificateById.pdf;
  } else if (req.files.image && req.files.pdf) {
    const image = req.files.image;
    const pdf = req.files.pdf;
    const imageFileSize = image.data.length;
    const pdfFileSize = pdf.data.length;
    const maxFileSize = 50 * 1024 * 1024;
    const pdfExt = path.extname(pdf.name);
    const imageExt = path.extname(image.name);
    pdfFileName = datetimenow() + pdf.md5 + pdfExt;
    imageFileName = datetimenow() + image.md5 + imageExt;
    const allowedType = [".png", ".jpg", ".jpeg", ".pdf"];

    if (!allowedType.includes(imageExt.toLowerCase()))
      return res.status(422).json({ msg: "Invalid Images" });
    if (!allowedType.includes(pdfExt.toLowerCase()))
      return res.status(422).json({ msg: "Invalid PDF" });
    if (imageFileSize > maxFileSize)
      return res.status(422).json({ msg: "Image must be less than 50 MB" });
    if (pdfFileSize > maxFileSize)
      return res.status(422).json({ msg: "PDF must be less than 50 MB" });
    try {
      const imageQuery = `name='${getCertificateById.image}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${getCertificateById.image}' not found`);
      }
      const imageFileId = imageResponse.data.files[0].id;

      const pdfQuery = `name='${getCertificateById.pdf}' and mimeType contains 'application/pdf'`;
      const pdfResponse = await drive.files.list({
        q: pdfQuery,
        fields: "files(id)",
      });

      if (pdfResponse.data.files.length === 0) {
        throw new Error(`File '${getCertificateById.pdf}' not found`);
      }
      const pdfFileId = pdfResponse.data.files[0].id;

      drive.files.delete({
        fileId: imageFileId,
      });
      drive.files.delete({
        fileId: pdfFileId,
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error.message);
    }

    try {
      //IMAGE
      const imageFileMetadata = {
        name: imageFileName,
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

      const imageQuery = `name='${imageFileName}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${imageFileName}' not found`);
      }
      const imageFileId = imageResponse.data.files[0].id;
      const imageUrl = `https://drive.google.com/uc?export=view&id=${imageFileId}`;

      //PDF
      const pdfFileMetadata = {
        name: pdfFileName,
        parents: [MY_PDF_FOLDER_PARENT_ID],
      };
      const pdfMedia = {
        mimeType: pdf.mimetype,
        body: Stream.Readable.from(pdf.data),
      };
      await drive.files.create({
        requestBody: pdfFileMetadata,
        media: pdfMedia,
        fields: "id",
      });
      const pdfQuery = `name='${pdfFileName}' and mimeType contains 'pdf'`;
      const pdfResponse = await drive.files.list({
        q: pdfQuery,
        fields: "files(id)",
      });
      if (pdfResponse.data.files.length === 0) {
        throw new Error(`File '${pdfFileName}' not found`);
      }
      const pdfFileId = pdfResponse.data.files[0].id;
      const pdfUrl = `https://drive.google.com/uc?export=view&id=${pdfFileId}`;
      await Certificates.update(
        {
          certificate: certificate.toUpperCase(),
          image: imageFileName,
          imageUrl,
          pdf: pdfFileName,
          pdfUrl,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      res.status(201).json({ msg: `Certificate Updated Successfully` });
    } catch (error) {
      console.log(error.message);
    }
  } else if (req.files.image) {
    const image = req.files.image;
    const imageFileSize = image.data.length;
    const maxFileSize = 50 * 1024 * 1024;
    const imageExt = path.extname(image.name);
    imageFileName = datetimenow() + image.md5 + imageExt;
    pdfFileName = getCertificateById.pdf;
    const allowedType = [".png", ".jpg", ".jpeg", ".pdf"];

    if (!allowedType.includes(imageExt.toLowerCase()))
      return res.status(422).json({ msg: "Invalid Images" });
    if (imageFileSize > maxFileSize)
      return res.status(422).json({ msg: "Image must be less than 50 MB" });
    try {
      const imageQuery = `name='${getCertificateById.image}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${getCertificateById.image}' not found`);
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
      //IMAGE
      const imageFileMetadata = {
        name: imageFileName,
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

      const imageQuery = `name='${imageFileName}' and mimeType contains 'image'`;
      const imageResponse = await drive.files.list({
        q: imageQuery,
        fields: "files(id)",
      });

      if (imageResponse.data.files.length === 0) {
        throw new Error(`File '${imageFileName}' not found`);
      }
      const imageFileId = imageResponse.data.files[0].id;
      const imageUrl = `https://drive.google.com/uc?export=view&id=${imageFileId}`;
      await Certificates.update(
        {
          certificate: certificate.toUpperCase(),
          image: imageFileName,
          imageUrl,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      res.status(201).json({ msg: `Certificate Updated Successfully` });
    } catch (error) {
      console.log(error.message);
    }
  } else if (req.files.pdf) {
    const pdf = req.files.pdf;
    const pdfFileSize = pdf.data.length;
    const maxFileSize = 50 * 1024 * 1024;
    const pdfExt = path.extname(pdf.name);
    pdfFileName = datetimenow() + pdf.md5 + pdfExt;
    imageFileName = getCertificateById.image;
    const allowedType = [".png", ".jpg", ".jpeg", ".pdf"];

    if (!allowedType.includes(pdfExt.toLowerCase()))
      return res.status(422).json({ msg: "Invalid PDF" });
    if (pdfFileSize > maxFileSize)
      return res.status(422).json({ msg: "PDF must be less than 50 MB" });
    try {
      const pdfQuery = `name='${getCertificateById.pdf}' and mimeType contains 'application/pdf'`;
      const pdfResponse = await drive.files.list({
        q: pdfQuery,
        fields: "files(id)",
      });

      if (pdfResponse.data.files.length === 0) {
        throw new Error(`File '${getCertificateById.pdf}' not found`);
      }
      const pdfFileId = pdfResponse.data.files[0].id;
      drive.files.delete({
        fileId: pdfFileId,
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error.message);
    }
    try {
      //PDF
      const pdfFileMetadata = {
        name: pdfFileName,
        parents: [MY_PDF_FOLDER_PARENT_ID],
      };
      const pdfMedia = {
        mimeType: pdf.mimetype,
        body: Stream.Readable.from(pdf.data),
      };
      await drive.files.create({
        requestBody: pdfFileMetadata,
        media: pdfMedia,
        fields: "id",
      });
      const pdfQuery = `name='${pdfFileName}' and mimeType contains 'pdf'`;
      const pdfResponse = await drive.files.list({
        q: pdfQuery,
        fields: "files(id)",
      });
      if (pdfResponse.data.files.length === 0) {
        throw new Error(`File '${pdfFileName}' not found`);
      }
      const pdfFileId = pdfResponse.data.files[0].id;
      const pdfUrl = `https://drive.google.com/uc?export=view&id=${pdfFileId}`;
      await Certificates.update(
        {
          certificate: certificate.toUpperCase(),
          pdf: pdfFileName,
          pdfUrl,
        },
        {
          where: {
            id: req.params.id,
          },
        }
      );
      res.status(201).json({ msg: `Certificate Updated Successfully` });
    } catch (error) {
      console.log(error.message);
    }
  }
};

export const deleteCertificate = async (req, res) => {
  const getCertificateById = await Certificates.findOne({
    where: {
      id: req.params.id,
    },
  });
  if (!getCertificateById)
    return res.status(404).json({ msg: "No Data Found" });

  try {
    const imageQuery = `name='${getCertificateById.image}' and mimeType contains 'image'`;
    const imageResponse = await drive.files.list({
      q: imageQuery,
      fields: "files(id)",
    });

    if (imageResponse.data.files.length === 0) {
      throw new Error(`File '${getCertificateById.image}' not found`);
    }
    const imageFileId = imageResponse.data.files[0].id;

    const pdfQuery = `name='${getCertificateById.pdf}' and mimeType contains 'application/pdf'`;
    const pdfResponse = await drive.files.list({
      q: pdfQuery,
      fields: "files(id)",
    });

    if (pdfResponse.data.files.length === 0) {
      throw new Error(`File '${getCertificateById.pdf}' not found`);
    }
    const pdfFileId = pdfResponse.data.files[0].id;

    drive.files.delete({
      fileId: imageFileId,
    });
    drive.files.delete({
      fileId: pdfFileId,
    });

    await Certificates.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ msg: `Certificate deleted Successfully` });
  } catch (error) {
    console.log(error.message);
  }
};
