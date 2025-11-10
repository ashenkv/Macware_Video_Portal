// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import cloudinary from "./config/cloudinary.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables
dotenv.config();

// ES Module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Prisma Client
const prisma = new PrismaClient();

// JWT Secret
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

// ==================== AUTH ROUTES ====================

// Register Route
app.post("/api/register", async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "student",
      },
    });
    res.status(201).json({ message: "User created!", userId: user.id });
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ==================== STUDENT REGISTRATION ROUTE ====================

// POST /api/students/register - Teacher registers a student to a course
app.post("/api/students/register", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can register students." });
    }

    const { firstName, lastName, nic, email, password, courseId } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !courseId) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if course exists and belongs to teacher
    const course = await prisma.course.findFirst({
      where: {
        id: parseInt(courseId),
        teacherId: decoded.id,
      },
    });

    if (!course) {
      return res
        .status(404)
        .json({ error: "Course not found or you do not own it." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        role: "student",
        enrolledCourses: {
          connect: { id: parseInt(courseId) },
        },
      },
    });

    res.status(201).json({
      message: "Student registered and enrolled successfully!",
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        nic,
        courseId: parseInt(courseId),
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ==================== MANAGE COURSES ROUTES ====================

// POST /api/courses - Create course (Teacher only)
app.post("/api/courses", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can create courses." });
    }

    const { title } = req.body;
    const course = await prisma.course.create({
      data: {
        title,
        teacherId: decoded.id,
      },
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: "Course creation failed" });
  }
});

// PUT /api/courses/:id - Update course
app.put("/api/courses/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const courseId = parseInt(req.params.id);
  const { title } = req.body;

  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can update courses." });
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: decoded.id },
    });

    if (!course) {
      return res
        .status(404)
        .json({ error: "Course not found or you do not own it." });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { title },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE /api/courses/:id - Delete course
app.delete("/api/courses/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const courseId = parseInt(req.params.id);

  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can delete courses." });
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: decoded.id },
    });

    if (!course) {
      return res
        .status(404)
        .json({ error: "Course not found or you do not own it." });
    }

    await prisma.course.delete({ where: { id: courseId } });
    res.json({ message: "Course deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==================== MANAGE VIDEOS ====================

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// POST /api/videos/upload - Upload video (Teacher only)
app.post("/api/videos/upload", upload.single("video"), async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can upload videos." });
    }

    const { title, description, courseId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No video file uploaded." });
    }

    if (!title || !courseId) {
      return res
        .status(400)
        .json({ error: "Title and courseId are required." });
    }

    // Upload to Cloudinary (make public)
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
      folder: "scc_videos",
      public_id: `${Date.now()}-${file.originalname}`, // Unique ID
      access_mode: "public", // ← Make it public
    });

    // Save to MySQL
    const video = await prisma.video.create({
      data: {
        title,
        description: description || "",
        videoUrl: result.secure_url,
        duration: `${Math.round(result.duration)}s`,
        courseId: parseInt(courseId),
      },
    });

    // Optional: Delete local file after upload
    fs.unlinkSync(file.path);

    res.status(201).json({
      message: "✅ Video uploaded successfully!",
      video,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "❌ Video upload failed.",
      details: error.message,
    });
  }
});

// DELETE /api/videos/:id - Delete video (Teacher only)
app.delete("/api/videos/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const videoId = parseInt(req.params.id);

  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can delete videos." });
    }

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ error: "Video not found" });

    const course = await prisma.course.findFirst({
      where: { id: video.courseId, teacherId: decoded.id },
    });

    if (!course) {
      return res.status(403).json({ error: "You do not own this video." });
    }

    await prisma.video.delete({ where: { id: videoId } });
    res.json({ message: "Video deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==================== ENROLLMENT ROUTES ====================

// POST /api/enroll - Enroll student in a course (Teacher only)
app.post("/api/enroll", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can enroll students." });
    }

    const { studentId, courseId } = req.body;

    // Check if course belongs to teacher
    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: decoded.id },
    });

    if (!course) {
      return res
        .status(404)
        .json({ error: "Course not found or you do not own it." });
    }

    // Enroll student
    await prisma.course.update({
      where: { id: courseId },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    });

    res.json({ message: "Enrolled successfully!" });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ error: "Enrollment failed" });
  }
});

// ==================== VIDEO ROUTES ====================
// GET /api/videos - Only show videos from enrolled courses
app.get("/api/videos", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        enrolledCourses: {
          include: {
            videos: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const videos = user.enrolledCourses.flatMap((course) => course.videos);

    if (videos.length === 0) {
      console.log("No videos for user:", user.id);
      return res.json([]);
    }

    // Debug: Log video URLs to check if they're valid
    console.log(
      "Videos being sent to frontend:",
      videos.map((v) => ({
        id: v.id,
        title: v.title,
        videoUrl: v.videoUrl,
        urlLength: v.videoUrl?.length,
        urlType: typeof v.videoUrl,
        urlFirstChar: v.videoUrl?.[0],
        urlLastChar: v.videoUrl?.[v.videoUrl?.length - 1],
      }))
    );

    // Log the actual response being sent
    const responseData = JSON.stringify(videos);
    console.log("Response data length:", responseData.length);
    console.log("Response data preview:", responseData.substring(0, 300));

    res.json(videos);
  } catch (error) {
    console.error("Video fetch error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Optional: Connect to DB on startup
prisma
  .$connect()
  .then(() => console.log("🟢 DB Connected"))
  .catch((err) => console.error("🔴 DB Connection Failed:", err));
