const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is running");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("App connected to database.");
    app.listen(port, () => {
      console.log(`App is listening to port: ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/get-nodes", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("nodes");

    const { displayName } = req.query;
    const filter = displayName ? { displayName: displayName } : {};

    const nodes = await collection.find(filter).toArray();
    res.send(nodes);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/get-nodes-names", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("nodes");

    const { search, page = 1, limit = 10 } = req.query;

    const filter = search
      ? { displayName: { $regex: search, $options: "i" } }
      : {};

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const nodes = await collection
      .find(filter)
      .project({ displayName: 1, iconUrl: 1 })
      .skip(skip)
      .limit(limitNumber)
      .toArray();

    const totalCount = await collection.countDocuments(filter);

    res.send({
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
      pageSize: limitNumber,
      data: nodes,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/get-node/:id", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("nodes");

    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);

    const node = await collection.findOne(objectId);

    if (!node) {
      return res.status(404).send({ message: "Node not found" });
    }

    res.send(node);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/workflows", async (req, res) => {
  try {
    const response = await axios.get(
      "https://hireagent.app.n8n.cloud/api/v1/workflows",
      {
        headers: {
          "X-N8N-API-KEY":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NjFkZGM4YS1hMGRmLTRkNWYtYmNiZC03YWJiNWNkZGUzZGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzM5MTY5ODIzfQ.YY7IwUVZh9PRp7hhgQy2h93jlVl-77dk_hBYIiitcV0",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});
