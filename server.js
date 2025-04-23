import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import colors from "colors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import http from "http";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import multer from "multer";
import socketIoSetup from "./helpers/socketIO.js";

//DOTENV
dotenv.config();
//hi
//hello

//MONGO CONNECTION
connectDB();

//REST OBJECT
const app = express();
const server = http.createServer(app);

socketIoSetup(server);

//middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

//ROUTES
app.use("/api/welcome", (req, res) => {
  res.status(200).send({ message: "Welcome to OrderUp API" });
});
app.use("/api/", userRoutes);
app.use("/api/", restaurantRoutes);
app.use("/api/", agentRoutes);

//PORT
const PORT = process.env.PORT || 8080;

//listen
server.listen(PORT, () => {
  console.log("Server running on", PORT.bgGreen.white);
});
