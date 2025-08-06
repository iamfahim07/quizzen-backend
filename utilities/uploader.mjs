// external import
import multer from "multer";

// multer file uploader function
export default function uploader(allowed_file_types, max_file_size, error_msg) {
  // multer storage
  const storage = multer.memoryStorage();

  // multer file upload configuration
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: max_file_size,
    },
    fileFilter: (req, file, cb) => {
      if (allowed_file_types.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(error_msg));
      }
    },
  });

  return upload;
}
