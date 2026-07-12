import "dotenv/config";
import express from "express";
import helmet from "helmet";
import connectDB from "./db.js";
import authRouter from "./routes/auth.js";
import hostsRouter from "./routes/hosts.js";
import experiencesRouter from "./routes/experiences.js";
import bookingsRouter from "./routes/bookings.js";
import paymentsRouter from "./routes/payments.js";

const PORT = process.env.PORT || 8080;

if (!process.env.MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI environment variable. Did you copy server/.env.example to server/.env?",
  );
  process.exit(1);
}

const app = express();
app.use(helmet());
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/hosts", hostsRouter);
app.use("/api/v1/experiences", experiencesRouter);
app.use("/api/v1/bookings", bookingsRouter);
app.use("/api/v1/payments", paymentsRouter);

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
