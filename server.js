const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const socket = require("socket.io");
const axios = require("axios");
const multer = require("multer");



const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://nanicherry2312:r2XeMPVLjrBHiAJL@cluster0.kjaqps5.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("DB Connection Successful")

  } )
  .catch(err => console.error("Error connecting to database:", err.message));



const Message = mongoose.model("Message", mongoose.Schema({
  message: { text: { type: String, required: true } },
  users: [String],
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true }));

const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, required: true, min: 3, max: 20, unique: true },
  email: { type: String, required: true, unique: true, max: 50 },
  password: { type: String, required: true, min: 8 },
  isAvatarImageSet: { type: Boolean, default: false },
  avatarImage: { type: String, default: "" }
}));

// Authentication Routes
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.json({ msg: "Incorrect Username or Password", status: false });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.json({ msg: "Incorrect Username or Password", status: false });
    delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck) return res.json({ msg: "Username already used", status: false });
    const emailCheck = await User.findOne({ email });
    if (emailCheck) return res.json({ msg: "Email already used", status: false });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, password: hashedPassword });
    delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/avatars"); // Specify the directory where avatar images will be stored
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Rename the file to avoid conflicts
    },
  });
  
  const upload = multer({ storage });
  
  app.post("/api/auth/setavatar/:id", upload.single("avatar"), async (req, res, next) => {
    try {
      const userId = req.params.id;
      const imagePath = req.file.path; // Get the path to the uploaded image
  
      // Update user document in the database with the path to the uploaded image
      const user = await User.findByIdAndUpdate(userId, { isAvatarImageSet: true, avatarImage: imagePath }, { new: true });
  
      res.json({ isSet: true, image: imagePath,user});
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ msg: "Server error" });
    }
  });
  

app.get("/api/auth/allusers/:id", async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select(["email", "username", "avatarImage", "_id"]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/auth/setavatar/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const base64Image = req.body.image;
    const buffer = Buffer.from(base64Image, "base64");
    const userData = await User.findByIdAndUpdate(userId, { isAvatarImageSet: true, buffer }, { new: true });
    return res.json({ isSet: userData.isAvatarImageSet, image: userData.buffer });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth/logout/:id", async (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
});

// Message Routes
app.post("/api/messages/addmsg", async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await Message.create({ message: { text: message }, users: [from, to], sender: from });
    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/messages/getmsg", async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const messages = await Message.find({ users: { $all: [from, to] } }).sort({ updatedAt: 1 });
    const projectedMessages = messages.map(msg => ({ fromSelf: msg.sender.toString() === from, message: msg.message.text }));
    return res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth/profile/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }
      // Exclude sensitive information like password
      const { password, ...profileData } = user.toObject();
      res.json(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ msg: "Server error" });
    }
  });


app.put("/api/auth/updateprofile/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedProfile = req.body;
  
      // Update user document in the database with the updated profile data
      const user = await User.findByIdAndUpdate(userId, updatedProfile, { new: true });
  
      // Optionally, you can remove sensitive information (e.g., password) before sending the updated user object back to the client
      delete user.password;
  
      res.json({ status: true, user });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ msg: "Server error" });
    }
  });

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

const io = socket(server, { cors: { origin: "http://localhost:3000", credentials: true } });
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("add-user", (userId) => onlineUsers.set(userId, socket.id));
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
        console.log("User disconnected:", key);
      }
    });
  });
});
