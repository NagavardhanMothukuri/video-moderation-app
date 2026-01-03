import { useState } from "react";
import "./App.css";

const API = "https://video-moderation-app.onrender.com";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("token") !== null
  );

  const login = async () => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setLoggedIn(true);
    } else {
      alert("Login failed");
    }
  };

  if (!loggedIn) {
    return (
      <div className="login-container">
        <h1>VIDEO MODERATION SYSTEM</h1>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button onClick={login}>ENTER DASHBOARD</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>You are logged in securely.</p>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          setLoggedIn(false);
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default App;
