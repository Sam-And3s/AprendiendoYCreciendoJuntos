const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/api/send-email', upload.single('imagen'), async (req, res) => {
  try {
    const toEmail = req.body.to || process.env.EMAIL_TO;
    const subject = req.body.subject || 'Nuevo mensaje desde el sitio';

    if (!toEmail) {
      return res.status(400).json({ message: 'No se encontró la dirección de destino.' });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
    const emailSecure = process.env.EMAIL_SECURE === 'true';

    if (!emailUser || !emailPass || !emailHost) {
      return res.status(500).json({ message: 'El servidor no está configurado para enviar correos. Revisa las variables de entorno.' });
    }

    let textBody = `Formulario: ${subject}\n\n`;
    Object.keys(req.body).forEach((key) => {
      if (key === 'subject' || key === 'to') return;
      textBody += `${key}: ${req.body[key]}\n`;
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || emailUser,
      to: toEmail,
      subject,
      text: textBody,
    };

    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
        },
      ];
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail(mailOptions);

    return res.json({ message: 'Correo enviado correctamente.' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Error al enviar el correo. Revisa la configuración del servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Email server running on http://localhost:${PORT}`);
});
