const AWS = require('aws-sdk');
const multer = require("multer");
const uuid = require("uuid").v4;

const { minioUrl, minioBucket, minioPass, minioUser } = require("../config")
const upload = multer({
    storage: multer.memoryStorage()
});
// Configure S3 endpoint
const s3 = new AWS.S3({
    endpoint: minioUrl,
    accessKeyId: minioUser,
    secretAccessKey: minioPass,
    s3ForcePathStyle: true,
    s3BucketEndpoint: minioUrl
});



const uploadDocument = (req, res, next) => {
    // Use multer to handle the file upload
    upload.single("document")(req, res, async (err) => {
        // If there's an error during the upload, log the error and send a response with status 400 and the error message
        if (err) {
            console.log({ err })
            return res.status(400).json({ ok: false, messaage: err.message });
        }
        // Get the uploaded files from the request
        const uploadedFile = req.file;
        // If no audio file is found in the request, send a response with status 400 and an appropriate message
        if (!uploadedFile) {
            return res.status(400).json({ ok: false, message: "No file found" });
        }

        // Upload audio file
        const ext = uploadedFile.originalname.split('.').pop();
        const fileName = `${uuid().replace(/-/g, '')}.${ext}`;

        const params = {
            Bucket: minioBucket,
            Key: fileName,
            Body: uploadedFile.buffer
        };

        try {
            const data = await s3.upload(params).promise();
            // const pdfFileBuffer = await convertDocxToPdf(uploadedFile.buffer, s3, minioBucket);
            // const thumbnail = await generatePdfThumbnail(pdfFileBuffer, s3, minioBucket);

            req.fileUrl = data.Location;
            req.fileKey = data.Key || fileName;
            req.fileExt = ext;
            req.fileSize = uploadedFile.size;
            next();
        } catch (err) {
            await rollbackUpload(fileName);
            console.error(err);
            return res.status(500).json({ ok: false, message: err.message });
        }


    });
};

const uploadPhoto = (req, res, next) => {
    // Use multer to handle the file upload
    upload.single("photo")(req, res, async (err) => {
        // If there's an error during the upload, log the error and send a response with status 400 and the error message
        if (err) {
            return res.status(400).json({ ok: false, messaage: err.message });
        }
        // Get the uploaded files from the request
        const uploadedFile = req.file;
        // If no audio file is found in the request, send a response with status 400 and an appropriate message
        if (!uploadedFile) {
            return res.status(400).json({ ok: false, message: "No file found" });
        }

        // Upload audio file
        const ext = uploadedFile.originalname.split('.').pop();
        const fileName = `${uuid().replace(/-/g, '')}.${ext}`;

        const params = {
            Bucket: minioBucket,
            Key: fileName,
            Body: uploadedFile.buffer
        };

        try {
            const data = await s3.upload(params).promise();
            req.fileUrl = data.Location; // Store the complete S3 URL
            next();
        } catch (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }


    });
};

const base64toURL = async (req, res, next) => {
    try {
        const uploadPromises = [];

        // Function to process a single base64 string
        const processBase64 = async (base64String, path) => {
            // Use the regex to extract parts
            const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            // Validate that the regex match worked as expected
            if (!matches || matches.length !== 3) {
                throw new Error(`Invalid base64 string at ${path.join('.')}`);
            }

            // Extract the file extension and content
            const ext = matches[1];  // e.g., "png"
            const base64Data = matches[2];  // base64 content

            // Convert base64 data to a buffer
            const buffer = Buffer.from(base64Data, 'base64');

            // Generate a unique filename with extension
            const fileName = `${uuid().replace(/-/g, '')}.${ext}`;
            const params = {
                Bucket: minioBucket,
                Key: fileName,
                Body: buffer,
                ContentType: `image/${ext}`
            };
            // Upload the buffer to S3 (or MinIO)
            const data = await s3.upload(params).promise();
            // console.log({
            //     path: path,
            //     location: data.Location,
            //     fileKey: data.Key || fileName,
            //     fileExt: ext
            // })
            // Return the result with necessary fields
            return {
                path: path,
                location: data.Location,
                fileKey: data.Key || fileName,
                fileExt: ext
            };
        };


        // Recursively search for base64 strings in the request body
        const findAndReplaceBase64Strings = (obj, currentPath = []) => {
            for (const key in obj) {
                const newPath = [...currentPath, key];
                if (Array.isArray(obj[key])) {
                    // Handle array of base64 strings
                    obj[key].forEach((item, index) => {
                        if (typeof item === 'string' && item.startsWith('data:image')) {
                            uploadPromises.push(processBase64(item, [...newPath, index]));
                        } else if (typeof item === 'object' && item !== null) {
                            // Handle nested object in array
                            findAndReplaceBase64Strings(item, [...newPath, index]);
                        }
                    });
                } else if (typeof obj[key] === 'string' && obj[key].startsWith('data:image')) {
                    // Handle single base64 string
                    uploadPromises.push(processBase64(obj[key], newPath));
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    // Recursively search nested objects
                    findAndReplaceBase64Strings(obj[key], newPath);
                }
            }
        };

        // Start the search for base64 strings
        findAndReplaceBase64Strings(req.body);

        // If no images found, move to next middleware
        if (uploadPromises.length === 0) {
            return next();
        }
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        // Replace base64 strings with URLs in the original request body
        results.forEach(result => {
            let current = req.body;
            for (let i = 0; i < result.path.length - 1; i++) {
                current = current[result.path[i]];
            }
            const lastKey = result.path[result.path.length - 1];
            if (Array.isArray(current)) {
                // Replace item in array
                current[lastKey] = result.location;
            } else {
                // Replace single string
                current[lastKey] = result.location;
            }
        });

        // Add uploaded file information to request
        req.uploadedFiles = results.map(({ path, ...rest }) => rest);

        next();
    } catch (err) {
        console.error({ err });
        return res.status(500).json({ ok: false, message: err.message });
    }
};

// Rollback function to remove a file from S3
const rollbackUpload = async (key) => {
    const params = {
        Bucket: minioBucket,
        Key: key
    };
    try {
        await s3.deleteObject(params).promise();
        console.log(`File with key ${key} has been deleted from bucket ${minioBucket}`);
    } catch (err) {
        console.error(`Failed to delete file with key ${key} from bucket ${minioBucket}: ${err.message}`);
    }
};

module.exports = { uploadDocument, base64toURL, uploadPhoto, rollbackUpload }