import express from "express";
import { Router } from "express";
import data from "../data/data.js";

const chatRouter = express.Router();

chatRouter.get("/", (req, res) => {
  res.json(data);
});

chatRouter.get("/:id", (req, res) => {});

export default chatRouter;
