const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  PROJECT_URL: process.env.PROJECT_URL
};
