import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import productRoutes from "./routes/productRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(requestLogger);
app.use("/uploads", express.static("uploads"));
app.use("/products",productRoutes)
app.get("/health", (req, res) => {
  res.json({
    service: "product-service",
    status: "ok",
  });
});

app.use(errorHandler);



export default app;
