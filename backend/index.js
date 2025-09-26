const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectToDB = require("./config/db");
const dotenv = require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();

//

//
connectToDB();

app.listen(PORT, () => {
  console.log(`Server Running on http://localhost:${PORT}/`);
});
