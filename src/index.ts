import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import "dotenv/config";
import logger from "./utils/logger";
import checklistRouter from "./routes/checklist";
import authRouter from "./routes/auth";
const app: Express = express();
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/checklist", checklistRouter);
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("MongoDB connection error:", err));

const PORT: number = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

export default app;
