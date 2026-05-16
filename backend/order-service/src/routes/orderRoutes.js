import { Router } from "express";
import {
  createOrder,
  getOrderById,
} from "../controllers/orderController.js";

const router = Router();

router.post("/", createOrder);
router.get("/:orderId", getOrderById);

export default router;
