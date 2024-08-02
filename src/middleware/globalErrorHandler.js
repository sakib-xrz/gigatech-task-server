const ApiError = require("../error/ApiError.js");
const { config } = require("../config/config.js");

const globalErrorHandler = (err, _req, res, _next) => {
  console.log(`💀 Global Error Handler ~`, err);
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorMessages = [];

  if (err instanceof ApiError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorMessages = err?.message
      ? [
          {
            path: "",
            message: err?.message,
          },
        ]
      : [];
  } else if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired, please login again!";
    errorMessages = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please provide a valid token.";
    errorMessages = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err?.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    message = `${errors.join(". ")}`;
    statusCode = 400;
    errorMessages = errors.map((error) => ({
      path: "",
      message: error,
    }));
  } else if (err?.name === "CastError") {
    message = `Invalid ${err.path}: ${err.value}.`;
    statusCode = 400;
    errorMessages = [
      {
        path: err.path,
        message: message,
      },
    ];
  } else if (err?.name === "MongoError" && err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    message = `Duplicate field value: ${value}. Please use another value!`;
    statusCode = 400;
    errorMessages = [
      {
        path: "",
        message: message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== "production" ? err?.stack : undefined,
  });
};

module.exports = globalErrorHandler;
