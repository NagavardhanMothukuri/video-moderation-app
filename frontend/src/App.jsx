import { useState, useEffect } from "react";

const API = "https://video-moderation-app.onrender.com";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);

  /* ================= LOGIN ================= */

  async function login() {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) return alert("Login failed");

    localStorage.setItem("token", data.token);
    setToken(data.token);
  }

  /* ================= FETCH VIDEOS ================= */

  async function loadVideos() {
    const res = await fetch(`${API}/videos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setVideos(data);
  }

  useEffect(() => {
    if (token) loadVideos();
  }, [token]);

  /* ================= UPLOAD ================= */

  async function uploadVideo() {
    if (!file) return alert("Select a file");

    const form = new FormData();
    form.append("video", file);

    await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    alert("Upload started");
    loadVideos();
  }

  /* ================= LOGOUT ================= */

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  /* ================= UI ================= */

  if (!token) {
    return (
      <div style={styles.container}>
        <h1>VIDEO MODERATION SYSTEM</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>ENTER DASHBOARD</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Dashboard</h1>
      <p>You are logged in securely.</p>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadVideo}>Upload Video</button>

      <h2>My Videos</h2>

      {videos.map((v) => (
        <div key={v._id} style={styles.card}>
          <p><b>File:</b> {v.filename}</p>
          <p><b>Status:</b> {v.status}</p>
          <p><b>Sensitivity:</b> {v.sensitivity}</p>

          {v.status === "done" && (
            <video width="300" controls>
              <source
                src={`${API}/stream/${v.filename}`}
                type="video/mp4"
              />
            </video>
          )}
        </div>
      ))}

      <button onClick={logout}>Logout</button>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "30px",
    color: "white",
    background: "linear-gradient(120deg,#1b1f3b,#2c2f6c)",
    minHeight: "100vh",
  },
  card: {
    background: "#111",
    padding: "15px",
    margin: "15px 0",
  },
};
