// external import
import path from "path";

// internal import
import "../firebase.mjs";
import singleUploader from "../utilities/uploader.mjs";

// receive the image
export default function topicDataValidator(req, res, next) {
  const upload = singleUploader(
    ["image/png", "image/jpg", "image/jpeg", "image/webp", "image/jfif"],
    3000000,
    "Only .jpg, .jpeg, .jfif, .png and .webp formet are allowed!"
  );

  // call the image uploader function
  upload.single("quiz_image")(req, res, async (err) => {
    const title =
      typeof req.body.title === "string" &&
      req.body.title.trim().length > 0 &&
      req.body.title.trim().length <= 20
        ? true
        : false;

    const description =
      typeof req.body.description === "string" &&
      req.body.description.trim().length > 0 &&
      req.body.description.trim().length <= 230
        ? true
        : false;

    try {
      if (title && description) {
        if (err) {
          throw new Error(err);
        } else {
          // checking if file exist or not
          if (req.file) {
            // modifying the image name
            const ext = path.extname(req.file.originalname);
            const modifiedName =
              req.file.originalname
                .replace(ext, "")
                .toLowerCase()
                .split(" ")
                .join("-") +
              "-" +
              Date.now() +
              ext;

            // reciving the image buffer
            const img_buffer = req.file.buffer;

            // create the image from buffer
            const img_object = new File([img_buffer], req.file.originalname, {
              type: req.file.mimetype,
            });

            // sending the necessary data to the next middleware
            req.body.img_object = img_object;
            req.body.img_ref = modifiedName;

            next();
          } else {
            // sending the necessary data to the next middleware
            req.body.img_object = null;
            req.body.img_ref = null;

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
          ? "The file size of the image you uploaded is too large. Please select a file within the size limit."
          : err.message;

      res.status(500).json({
        message: errorMessage,
      });
    }
  });
}
