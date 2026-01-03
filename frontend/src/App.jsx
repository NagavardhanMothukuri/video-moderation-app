import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login on load
  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (auth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  // Demo Login Handler
  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    // DEMO AUTH SUCCESS
    localStorage.setItem("auth", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setIsLoggedIn(false);
  };

  // ---------------- UI ----------------

  // LOGIN PAGE
  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <h1 className="title">VIDEO MODERATION SYSTEM</h1>
        <p className="subtitle">Upload · Analyze · Stream · Review</p>

        <form className="login-card" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">ENTER DASHBOARD</button>
        </form>
      </div>
    );
  }

  // DASHBOARD PAGE
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Video Moderation Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <div className="dashboard-content">
        <div className="card">
          <h3>Upload Video</h3>
          <input type="file" />
        </div>

        <div className="card">
          <h3>Processing Status</h3>
          <p>Status: Waiting for upload</p>
        </div>

        <div className="card">
          <h3>Video Library</h3>
          <p>No videos yet</p>
        </div>
      </div>
    </div>
  );
}

export default App;
