const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ApiError = require("../error/ApiError.js");
const { config } = require("../config/config.js");

const catchAsync = require("../utils/catchAsync.js");
const sendResponse = require("../utils/sendResponse.js");

const User = require("../models/user.model.js");

const register = catchAsync(async (req, res) => {
  const { ...registerData } = req.body;

  let { name, username, password } = registerData;

  if (!name || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const userAlreadyExists = await User.findOne({ username });

  if (userAlreadyExists) {
    throw new ApiError(400, "username already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  password = hashedPassword;

  const newUser = await User.create({ name, username, password });

  const payload = {
    _id: newUser._id,
  };

  const secret = config.jwtSecret;
  const expiresIn = config.jwtExpiresIn;

  const token = jwt.sign(payload, secret, {
    expiresIn,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Registration successful",
    data: {
      access: token,
    },
  });
});

const login = catchAsync(async (req, res) => {
  const { ...loginData } = req.body;

  const { username, password } = loginData;

  if (!username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    throw new ApiError(404, "No user found with this username");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new ApiError(401, "Incorrect username or password");
  }

  const payload = {
    _id: user._id,
  };

  const secret = config.jwtSecret;
  const expiresIn = config.jwtExpiresIn;

  const token = jwt.sign(payload, secret, {
    expiresIn,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: {
      access: token,
    },
  });
});

const AuthController = {
  register,
  login,
};

module.exports = AuthController;
