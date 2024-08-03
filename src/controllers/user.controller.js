const catchAsync = require("../utils/catchAsync.js");
const sendResponse = require("../utils/sendResponse.js");

const ApiError = require("../error/ApiError.js");

const User = require("../models/user.model.js");

const getMe = catchAsync(async (req, res) => {
  const user = req.user;

  const userExist = await User.findById(user._id);

  if (!userExist) {
    throw new ApiError(404, "User not found");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User data retrieved",
    data: {
      user: userExist,
    },
  });
});

const getUsers = catchAsync(async (req, res) => {
  const search = req.query.search || "";
  const user = req.user;

  let query = {
    $and: [
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { username: search },
        ],
      },
      { _id: { $ne: user._id } },
    ],
  };

  const users = await User.find(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    meta: {
      count: users.length,
    },
    message: "Users retrieved successfully",
    data: {
      users,
    },
  });
});

const UserController = {
  getMe,
  getUsers,
};

module.exports = UserController;
