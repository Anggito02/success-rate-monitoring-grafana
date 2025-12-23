import multer from 'multer'

// Configure Multer for memory storage
const storage = multer.memoryStorage()

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

