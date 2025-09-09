import express from "express";
import {
  getInventoryOverview,
  getProductInventory,
  updateProductStock,
  bulkUpdateStock,
  reserveStock,
  releaseStock,
  getLowStockAlerts,
  getInventoryReports,
  setLowStockThreshold,
} from "../controllers/inventoryController.js";
import authUser from "../middleware/authUser.js";
import adminAuth from "../middleware/adminAuth.js";

const inventoryRouter = express.Router();

// Public routes (for stock checking)
inventoryRouter.get("/overview", getInventoryOverview);
inventoryRouter.get("/product/:productId", getProductInventory);
inventoryRouter.get("/alerts", getLowStockAlerts);
inventoryRouter.get("/reports", getInventoryReports);

// User routes (protected)
inventoryRouter.post("/reserve", authUser, reserveStock);
inventoryRouter.post("/release", authUser, releaseStock);

// Admin routes (protected)
inventoryRouter.put("/product/:productId/stock", adminAuth, updateProductStock);
inventoryRouter.put("/bulk-update", adminAuth, bulkUpdateStock);
inventoryRouter.put("/product/:productId/threshold", adminAuth, setLowStockThreshold);

export default inventoryRouter;