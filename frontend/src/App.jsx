import { useState, useEffect } from "react";

const API = "https://video-moderation-app.onrender.com";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [file, setFile] = useState(null);
  const [videos, setVideos] = useState([]);

  async function login() {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Login failed");

    localStorage.setItem("token", data.token);
    setToken(data.token);
  }

  async function loadVideos() {
    const res = await fetch(`${API}/videos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setVideos(await res.json());
  }

  async function uploadVideo() {
    if (!file) return alert("Select a video");

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

  function logout() {
    localStorage.clear();
    setToken(null);
  }

  useEffect(() => {
    if (token) loadVideos();
  }, [token]);

  if (!token) {
    return (
      <div className="login">
        <h1>VIDEO MODERATION SYSTEM</h1>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={login}>ENTER DASHBOARD</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="subtitle">Upload, analyze and review videos</p>

      <div className="card">
        <h3>Upload Video</h3>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={uploadVideo}>Upload</button>
      </div>

      <h2>My Videos</h2>

      <div className="grid">
        {videos.map((v) => (
          <div className="video-card" key={v._id}>
            <p className="name">{v.filename}</p>
            <span className={`badge ${v.status}`}>{v.status}</span>
            <p>Sensitivity: {v.sensitivity}</p>

            {v.status === "done" && (
              <video controls>
                <source src={`${API}/stream/${v.filename}`} />
              </video>
            )}
          </div>
        ))}
      </div>

      <button className="logout" onClick={logout}>Logout</button>
    </div>
  );
}
