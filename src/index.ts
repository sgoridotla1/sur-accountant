import express from "express";

const app = express();
const port = 3000;

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
