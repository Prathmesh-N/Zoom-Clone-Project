import { User } from "../models/users.js";
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "node:crypto";
import { Meeting } from "../models/meeting.js";

const findUserByToken = async (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  return User.findOne({ tokens: token });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    let isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      let token = crypto.randomBytes(32).toString("hex");
      user.tokens = token;
      await user.save();
      return res.status(httpStatus.OK).json({ token: token });
    } else {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong during login",
    });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    if (!name || !username || !password) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Name, username and password are required" });
    }

    const trimmedUsername = username.trim();
    const trimmedName = name.trim();

    if (!trimmedName || !trimmedUsername || password.length < 6) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message:
          "Valid name and username are required, and password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "Username already exists" });
    }

    const hashedPassword = await hash(password, 10);
    const newUser = new User({
      name: trimmedName,
      username: trimmedUsername,
      password: hashedPassword,
    });
    await newUser.save();

    res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong during registration",
    });
  }
};

const getUserHistory = async (req, res) => {
  const token = req.body?.token || req.query?.token;

  try {
    if (!token) {
      return res.status(httpStatus.BAD_REQUEST).json([]);
    }

    const user = await findUserByToken(token);
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json([]);
    }
    const meetings = await Meeting.find({ user_id: user.username });
    return res.json(meetings);
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json([]);
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;
  try {
    if (!token || !meeting_code || !meeting_code.trim()) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Token and meeting code are required" });
    }

    const user = await findUserByToken(token);
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid token" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code.trim(),
    });
    await newMeeting.save();
    return res
      .status(httpStatus.CREATED)
      .json({ message: "Meeting added to history" });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while adding meeting history",
    });
  }
};

const deleteFromHistory = async (req, res) => {
  const { token, meeting_id } = req.body;

  try {
    if (!token || !meeting_id) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Token and meeting id are required" });
    }

    const user = await findUserByToken(token);
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid token" });
    }

    const deletedMeeting = await Meeting.findOneAndDelete({
      _id: meeting_id,
      user_id: user.username,
    });

    if (!deletedMeeting) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "Meeting not found" });
    }

    return res.status(httpStatus.OK).json({ message: "Meeting deleted" });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while deleting meeting history",
    });
  }
};

export { login, register, getUserHistory, addToHistory, deleteFromHistory };
