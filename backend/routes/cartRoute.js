import express from "express";
import authUser from "../middleware/authUser.js";
import {
  addTocart,
  getUserCart,
  updateCart,
} from "../controllers/cartController.js";
const cartRouter = express.Router();

cartRouter.get("/get", authUser, getUserCart);
cartRouter.post("/add", authUser, addTocart);
cartRouter.post("/update", authUser, updateCart);

export default cartRouter;
