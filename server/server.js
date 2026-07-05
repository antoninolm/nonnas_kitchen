import express from "express";

const app = express();
const PORT = 8080;

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
