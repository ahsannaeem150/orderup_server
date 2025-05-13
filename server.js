import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import colors from "colors";
import morgan from "morgan";
import http from "http";
import multer from "multer";

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import socketIoSetup from "./helpers/socketIO.js";

// CONFIGURE ENV VARIABLES
dotenv.config();

// CREATE EXPRESS APP AND HTTP SERVER
const app = express();
const server = http.createServer(app);

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// API ROUTES
app.use("/api/welcome", (req, res) => {
  res.status(200).send({ message: "Welcome to OrderUp API" });
});
app.use("/api/", userRoutes);
app.use("/api/", restaurantRoutes);
app.use("/api/", agentRoutes);

// PORT
const PORT = process.env.PORT || 8080;

// START SERVER FUNCTION
const startServer = async () => {
  try {
    await connectDB();

    socketIoSetup(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`.bgGreen.white);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error}`.bgRed.white);
    process.exit(1);
  }
};

// RUN THE SERVER
startServer();
