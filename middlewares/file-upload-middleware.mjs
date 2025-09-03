// internal import
import fileUploader from "../utilities/uploader.mjs";

export default function fileUploadMiddleware(req, res, next) {
  const upload = fileUploader(
    [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "image/jfif",
      "application/pdf",
      "text/plain",
    ],
    15000000,
    "Only Image, PDF and TXT formats are allowed!"
  );

  upload.array("quiz_files", 10)(req, res, async (err) => {
    const prompt =
      typeof req.body.prompt === "string" && req.body.prompt.trim().length > 0
        ? true
        : false;

    try {
      if (prompt) {
        if (err) {
          throw new Error(err);
        } else {
          if (req.files && req.files.length > 0) {
            req.body.files_array = req.files;

            next();
          } else {
            req.body.files_array = null;

            next();
          }
        }
      } else {
        res.status(409).json({
          message:
            "String field error, either empty field or characters limit exceed",
        });
      }
    } catch (err) {
      const errorMessage =
        err.message === "MulterError: File too large"
          ? "The file size you uploaded is too large. Please select a file within the size limit."
          : err.message;

      res.status(500).json({
        message: errorMessage,
      });
    }
  });
}
