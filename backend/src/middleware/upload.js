const multer = require('multer')
const path   = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp-userId-originalname
    const unique = `${Date.now()}-${req.user._id}-${file.originalname.replace(/\s+/g, '_')}`
    cb(null, unique)
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
})

module.exports = upload
