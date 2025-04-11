// server/server.js
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = require("./home-customization-67874-firebase-adminsdk-fbsvc-22053b9df4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Delete user route
app.delete("/delete-user/:uid", async (req, res) => {
  try {
    await admin.auth().deleteUser(req.params.uid);
    res.send({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
