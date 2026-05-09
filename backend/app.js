import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MySQL Connection (create but only connect when not in test)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cookio"
});

if (process.env.NODE_ENV !== "test") {
  db.connect(err => {
    if (err) {
      console.error("❌ Database connection failed:", err);
      return;
    }
    console.log("✅ MySQL Connected");
  });
}

// ✅ API: Save Login Info
app.post("/save-login", (req, res) => {
  const { uid, email } = req.body;

  const checkQuery = "SELECT * FROM users WHERE uid = ?";
  db.query(checkQuery, [uid], (err, results) => {
    if (err) {
      console.error("❌ Error checking user:", err);
      return res.status(500).send("Database error");
    }

    if (results.length > 0) {
      const updateQuery = "UPDATE users SET login_count = login_count + 1, last_login = NOW() WHERE uid = ?";
      db.query(updateQuery, [uid], (err2) => {
        if (err2) {
          console.error("❌ Error updating user:", err2);
          return res.status(500).send("Database update error");
        }
        res.send("✅ User login info updated!");
      });
    } else {
      const insertQuery = "INSERT INTO users (uid, email) VALUES (?, ?)";
      db.query(insertQuery, [uid, email], (err3) => {
        if (err3) {
          console.error("❌ Error inserting user:", err3);
          return res.status(500).send("Database insert error");
        }
        res.send("✅ New user added!");
      });
    }
  });
});


// ✅ API: Get All Users (for testing)
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});


// ✅ Analytics API
app.get("/analytics/:uid", (req, res) => {
  const { uid } = req.params;

  const query = `
    SELECT cuisine, diet, calories
    FROM saved_recipes
    WHERE uid = ?
  `;

  db.query(query, [uid], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Analytics error");
    }
    res.json(results);
  });
});

export { app, db };
