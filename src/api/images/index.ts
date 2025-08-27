import express from "express";
import imagesRouter from "./images.router";

const app = express();

// Use the images router
app.use("/images", imagesRouter);

export default app;
