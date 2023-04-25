import { Certificates } from "../model/CertificateModel.js";
import path from "path";
import fs from "fs";
import datetimenow from "../datetimeFormatter.js";

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

  pdf.mv(`./public/uploads/certificates/PDF/${pdfFileName}`, async (err) => {
    if (err) {
      return res.status(500).json({ msg: err.message });
    }
    image.mv(
      `./public/uploads/certificates/images/${imageFileName}`,
      async (err) => {
        if (err) {
          return res.status(500).json({ msg: err.message });
        }
        try {
          await Certificates.create({
            certificate: certificate.toUpperCase(),
            image: imageFileName,
            pdf: pdfFileName,
          });
          res.status(201).json({ msg: `Certificate Created Successfully` });
        } catch (error) {
          console.log(error.message);
        }
      }
    );
  });
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
    const imageFilepath = `./public/uploads/certificates/images/${getCertificateById.image}`;
    const pdfFilepath = `./public/uploads/certificates/PDF/${getCertificateById.pdf}`;
    fs.unlinkSync(imageFilepath);
    fs.unlinkSync(pdfFilepath);
    pdf.mv(`./public/uploads/certificates/PDF/${pdfFileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
    });
    image.mv(
      `./public/uploads/certificates/images/${imageFileName}`,
      async (err) => {
        if (err) {
          return res.status(500).json({ msg: err.message });
        }
      }
    );
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
    const imageFilepath = `./public/uploads/certificates/images/${getCertificateById.image}`;
    fs.unlinkSync(imageFilepath);
    image.mv(
      `./public/uploads/images/certificates/${imageFileName}`,
      async (err) => {
        if (err) {
          return res.status(500).json({ msg: err.message });
        }
      }
    );
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
    const pdfFilepath = `./public/uploads/certificates/PDF/${getCertificateById.pdf}`;

    fs.unlinkSync(pdfFilepath);
    pdf.mv(`./public/uploads/certificates/PDF/${pdfFileName}`, async (err) => {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }
    });
  }
  try {
    await Certificates.update(
      {
        certificate: certificate.toUpperCase(),
        image: imageFileName,
        pdf: pdfFileName,
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
    const imageFilepath = `./public/uploads/certificates/images/${getCertificateById.image}`;
    const pdfFilepath = `./public/uploads/certificates/pdf/${getCertificateById.pdf}`;
    fs.unlinkSync(imageFilepath);
    fs.unlinkSync(pdfFilepath);
    await Certificates.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ msg: "Product Deleted Successfuly" });
  } catch (error) {
    console.log(error.message);
  }
};
