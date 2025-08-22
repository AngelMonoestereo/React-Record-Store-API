// server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());

// Test API route
app.get("/api/records", (req, res) => {
  const query = req.query.query;
  res.json([
    {
      id: 1,
      title: `Mock album for ${query}`,
      year: 1970,
      price: 25,
      cover_image: "https://via.placeholder.com/150",
    },
  ]);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
