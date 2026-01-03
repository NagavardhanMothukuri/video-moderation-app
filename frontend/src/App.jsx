import { useState, useEffect } from "react";

const API = "https://video-moderation-app.onrender.com";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [file, setFile] = useState(null);
  const [videos, setVideos] = useState([]);

  /* ================= LOGIN ================= */

  async function login() {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

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
    setTimeout(loadVideos, 3000);
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

      {videos.length === 0 && <p>No videos yet</p>}

      {videos.map((v) => (
        <div key={v._id} style={styles.card}>
          <p><b>{v.filename}</b></p>
          <p>Status: {v.status}</p>
          <p>Sensitivity: {v.sensitivity}</p>

          {v.status === "done" && (
            <video width="320" controls>
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
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e1b4b, #312e81)",
    color: "white",
    padding: "40px",
    fontFamily: "Arial",
  },
  card: {
    background: "#111827",
    padding: "15px",
    marginTop: "15px",
    borderRadius: "8px",
  },
};
