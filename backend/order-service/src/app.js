import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";
import orderRoutes from "./routes/orderRoutes.js";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(requestLogger);
app.use("/orders", orderRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "order-service",
    status: "ok",
  });
});

app.use(errorHandler);


export default app;
