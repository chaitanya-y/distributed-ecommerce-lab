import { Router } from "express";
import {
  createProduct,
  updateProduct,
  verifyProducts,
  listProducts,
  uploadProductImageForProduct,
  searchProductCatalog,

} from "../controllers/productController.js";
import { uploadProductImage } from "../middleware/uploadProductImage.js";


const router = Router();

router.post("/", createProduct);
router.get("/", listProducts);
router.post("/verify", verifyProducts);
router.patch("/:productId", updateProduct);
router.post(
  "/:productId/image",
  uploadProductImage.single("image"),
  uploadProductImageForProduct
);
router.get("/search", searchProductCatalog);



export default router;
