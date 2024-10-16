const path = require('path')
const express = require("express");
const morgan = require("morgan");
require('express-async-errors')
require('dotenv').config()
require('./db');
const cors = require("cors");
const userRouter = require("./routes/user");
const actorRouter = require("./routes/actor")
const movieRouter = require("./routes/movie")
const reviewRouter = require("./routes/review")
const adminRouter = require("./routes/admin");
const { handelNotFound } = require("./utils/helper");
const serverless = require('serverless-http');


const app = express();
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname,'public')))
app.use(morgan('dev'))
app.use("/api/user", userRouter);
app.use("/api/actor", actorRouter);
app.use("/api/movie", movieRouter);
app.use("/api/review", reviewRouter);  
app.use("/api/admin", adminRouter); 

app.use('/*',handelNotFound)
app.use((err,req,res,next)=>{
    console.log("err:",err);
    res.status(500).json({errro:err.message ||err })
})

app.post("/sign-in",
  (req, res, next) => {
    const { email, password } = req.body
    if (!email || !password)
      return res.json({ error: 'email/ password missing!' })
    next()
  },
  (req, res) => {
    res.send("<h1>Hello I am from your backend about</h1>");
  });


// Code to run it locally
// const PORT = process.env.PORT || 8000
// app.listen(PORT, () => {
//   console.log("the port is listening on port " + PORT);
//   // Dummy
// });

module.exports.handler = serverless(app); // Export the app for serverless
