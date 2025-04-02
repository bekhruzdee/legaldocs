import { diskStorage } from 'multer';
import * as path from 'path';

// Faylni saqlash uchun konfiguratsiya
export const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Yuklangan fayllar saqlanadigan papka
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);  // Fayl nomini yaratish
  },
});

// Yordamchi funksiya (faylni qaytarish)
export const uploadFile = (file: Express.Multer.File): string => {
  return file.path;  // Fayl yo'lini qaytarish
};
