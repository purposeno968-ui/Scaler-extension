const express = require("express");
const cors = require("cors");
const transcribeRoutes = require("./routes/transcribe.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/transcribe", transcribeRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Scaler++ Backend is running!" });
});

module.exports = app;
