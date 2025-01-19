require("dotenv").config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require("multer");
const path = require("path");

const db = require("./db");
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin:["https://afgmvm.vercel.app"],
    methods:["POST","GET","PUT","DELETE"],
    }));

const articlesRoute = require('./routes/articlesRoute');
const userRoute = require('./routes/userRoute');
const inventaireRoute = require('./routes/listInventaireRoute');
const mvmRoute = require('./routes/mvmRoute');
const csvRoute = require('./routes/importcsv');
const excelRoute = require('./routes/importExcel');
app.use('/api/articles/', articlesRoute);
app.use('/api/users/', userRoute);
app.use('/api/inventaire/', inventaireRoute);
app.use('/api/mvm/', mvmRoute);
app.use('/api/csv/', csvRoute);
app.use('/api/excel/', excelRoute);
//image:
const storage1 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images");
        
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
    },
});
//qrcode
const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        
        cb(null, "public/images/qr");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
    },
});

const upload = multer({ storage: storage1 });
const upload2 = multer({ storage: storage2 });

// Route pour uploader une image
app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
    }
    const imagePath = `/images/${req.file.filename}`;
    res.json({ path: imagePath }); // Retourne le chemin de l'image
});
// Route pour uploader qr
app.post("/uploadqr", upload2.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
    }
    const qrPath = `/images/qr/${req.file.filename}`;
    res.json({ path: qrPath }); // Retourne le chemin de l'image
});
// Rendre le dossier public accessible statiquement
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/images/qr", express.static(path.join(__dirname, "public/images/qr")));
// Endpoint to send email
app.post('/send-email', (req, res) => {
    console.log('Request received:', req.body);
    const { email, subject, text, pdfData } = req.body;

    // Decode the base64 PDF data
    const pdfBuffer = Buffer.from(pdfData, 'base64');

    // Create a Nodemailer transporter using your email provider's SMTP settings
    let transporter = nodemailer.createTransport({
        host: process.env.SMTPHOST,
        port: process.env.SMTPPORT,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTPUSER,
            pass: process.env.SMTPPASS,
        },
    });

    // Setup email data
    let mailOptions = {
        from: process.env.SMTPUSER,
        to: email.join(', '),
        subject: subject,
        text: text,
        attachments: [
            {
                filename: 'order.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ],
    };

    // Send email
     transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ error: error.toString() });
        }
        res.status(200).json({ message: 'Email sent', info: info.response });
    });
});

app.get("/", async (req, res) => {
    res.send("Server working!!!");
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});