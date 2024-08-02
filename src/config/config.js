require("dotenv").config();

const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  databaseUrl: process.env.MONGO_CONNECTION_STRING,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
};

module.exports = { config };
