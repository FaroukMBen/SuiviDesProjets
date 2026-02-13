const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // MIME types for CSV can vary (text/csv, application/csv, text/x-csv, etc.)
    // We also allow text/plain as some systems export CSV as .txt
    const allowedMimes = [
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel', // Often used for CSV on Windows
        'text/plain',
        'text/x-csv',
        'application/x-csv',
        'text/comma-separated-values',
        'text/x-comma-separated-values'
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Uniquement les fichiers CSV sont autorisés!'), false);
    }
};

const csvUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

module.exports = csvUpload;
