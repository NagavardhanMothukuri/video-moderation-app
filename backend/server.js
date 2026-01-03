/************************************************************
 * VIDEO MODERATION BACKEND – FINAL PRODUCTION VERSION
 * Stack: Node.js + Express + MongoDB + JWT + Socket.io
 ************************************************************/

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

/* ================= APP & SOCKET SETUP ================= */

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

/* ================= UPLOADS DIRECTORY ================= */

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

/* ================= DATABASE ================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

/* ================= MODELS ================= */

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "editor" },
});

const VideoSchema = new mongoose.Schema({
  filename: String,
  status: String,
  sensitivity: String,
  uploadedBy: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
const Video = mongoose.model("Video", VideoSchema);

/* ================= AUTH MIDDLEWARE ================= */

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token missing" });

  const token = header.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
}

/* ================= AUTH ROUTES ================= */
/* Register */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed });

    res.json({ message: "User registered successfully" });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});

/* Login */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

/* ================= MULTER CONFIG ================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

/* ================= UPLOAD VIDEO ================= */

app.post("/api/videos/upload", auth, upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const video = await Video.create({
    filename: req.file.filename,
    status: "processing",
    sensitivity: "unknown",
    uploadedBy: req.user.email,
  });

  let progress = 0;

  const interval = setInterval(async () => {
    progress += 20;

    io.emit("progress", {
      filename: video.filename,
      progress,
    });

    if (progress >= 100) {
      clearInterval(interval);
      video.status = "done";
      video.sensitivity = Math.random() > 0.5 ? "safe" : "flagged";
      await video.save();
    }
  }, 1000);

  res.json({ message: "Upload started", filename: video.filename });
});

/* ================= LIST USER VIDEOS ================= */

app.get("/api/videos", auth, async (req, res) => {
  const videos = await Video.find({ uploadedBy: req.user.email }).sort({
    createdAt: -1,
  });
  res.json(videos);
});

/* ================= STREAM VIDEO ================= */

app.get("/api/videos/stream/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const start = Number(range.replace(/\D/g, ""));
  const end = stat.size - 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${stat.size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Type": "video/mp4",
  });

  fs.createReadStream(filePath, { start, end }).pipe(res);
});

/* ================= SOCKET ================= */

io.on("connection", () => {
  console.log("Socket client connected");
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
