// login.js
import { auth } from "./firebase.js"; // Ensure firebase.js exports "auth"
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// DOM elements
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const statusMsg = document.getElementById("statusMsg");

// Function to display messages
const showMessage = (msg, success = false) => {
  statusMsg.textContent = msg;
  statusMsg.style.color = success ? "green" : "red";
};

// Function to save/update user login info in MySQL
async function saveLoginToDB(user) {
  try {
    const res = await fetch("http://localhost:5000/save-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email: user.email })
    });

    console.log("Fetch status:", res.status);
    const text = await res.text();
    console.log("Fetch response:", text);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    console.log("✅ User saved/updated in DB");
  } catch (error) {
    console.error("❌ Error saving user:", error);
  }
}


// Signup handler
signupBtn.addEventListener("click", async () => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
    await saveLoginToDB(userCred.user); // Save to DB
    showMessage("✅ Signup successful! Redirecting...", true);
    setTimeout(() => window.location.href = "index.html", 1000);
  } catch (err) {
    showMessage(`❌ ${err.message}`);
  }
});

// Login handler
loginBtn.addEventListener("click", async () => {
  try {
    const userCred = await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
    await saveLoginToDB(userCred.user); // Save to DB
    showMessage("🎉 Login successful! Redirecting...", true);
    setTimeout(() => window.location.href = "index.html", 1000);
  } catch (err) {
    showMessage(`❌ ${err.message}`);
  }
});

// Auto redirect if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "index.html";
  }
});
