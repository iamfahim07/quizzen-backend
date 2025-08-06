// external import

// internal import
// import "../firebase.mjs";
import fileUploader from "../utilities/uploader.mjs";

// receive the file
export default function fileUploadMiddleware(req, res, next) {
  // const upload = singleUploader(
  //   ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/jfif"],
  //   3000000,
  //   "Only .jpg, .jpeg, .jfif, .png and .webp formet are allowed!"
  // );
  const upload = fileUploader(
    [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "image/jfif",
      "application/pdf",
      "text/plain",
      // "application/msword",
      // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    15000000,
    // "Only image, PDF, TXT, DOC and DOCX formats are allowed!"
    "Only Image, PDF and TXT formats are allowed!"
  );

  // call the file uploader function
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
          // checking if file exist or not
          if (req.files && req.files.length > 0) {
            // modifying the image name
            // const ext = path.extname(req.file.originalname);
            // const modifiedName =
            //   req.file.originalname
            //     .replace(ext, "")
            //     .toLowerCase()
            //     .split(" ")
            //     .join("-") +
            //   "-" +
            //   Date.now() +
            //   ext;

            // reciving the image buffer
            // const img_buffer = req.file.buffer;

            // create the image from buffer
            // const img_object = new File([img_buffer], req.file.originalname, {
            //   type: req.file.mimetype,
            // });

            // sending the necessary data to the next middleware
            // req.body.img_object = img_object;
            // req.body.img_ref = modifiedName;

            req.body.files_array = req.files;

            next();
          } else {
            // sending the necessary data to the next middleware
            // req.body.img_object = null;
            // req.body.img_ref = null;

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
