const express = require('express');
const cookieParser = require('cookie-parser');  //used  to parse cookies from incoming requests

/* Routes */
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require("./routes/chat.routes");


/* using middlewares */
const app = express();
app.use(express.json());
app.use(cookieParser());


/* Using Routes */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);


module.exports = app;
