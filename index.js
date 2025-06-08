// 📁 backend/index.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const cors = require('cors'); // 👈 esto

const app = express();
app.use(cors({
  origin: '*'
}));


const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 5000;

// Autenticación con Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/credentials.json',
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const driveService = google.drive({ version: 'v3', auth });

// Ruta para recibir archivo y subirlo a Google Drive
app.post('/upload', upload.single('file'), async (req, res) => {
  const { originalname, path: tempPath } = req.file;
  const { customFileName } = req.body;

  try {
    const fileMetadata = {
      name: customFileName || originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: fs.createReadStream(tempPath),
    };

    const response = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    fs.unlinkSync(tempPath); // Borrar archivo temporal

    res.status(200).json({ fileId: response.data.id });
  } catch (err) {
    console.error('Error subiendo a Drive:', err);
    res.status(500).send('Error interno del servidor');
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
