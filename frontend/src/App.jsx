import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { API_BASE } from "./config";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [file, setFile] = useState(null);
  const [videos, setVideos] = useState([]);

  /* ---------------- LOGIN ---------------- */

  const login = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch {
      alert("Login failed");
    }
  };

  /* ---------------- FETCH VIDEOS ---------------- */

  const loadVideos = async () => {
    const res = await axios.get(`${API_BASE}/videos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setVideos(res.data);
  };

  useEffect(() => {
    if (token) loadVideos();
  }, [token]);

  /* ---------------- UPLOAD ---------------- */

  const uploadVideo = async () => {
    if (!file) return alert("Select a video");

    const form = new FormData();
    form.append("video", file);

    await axios.post(`${API_BASE}/upload`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    alert("Upload started");
    setFile(null);
    setTimeout(loadVideos, 2000);
  };

  /* ---------------- LOGOUT ---------------- */

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  /* ---------------- UI ---------------- */

  if (!token) {
    return (
      <div className="login-page">
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
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Upload, analyze and review videos</p>

      <div className="card">
        <h3>Upload Video</h3>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={uploadVideo}>Upload</button>
      </div>

      <h3>My Videos</h3>

      {videos.length === 0 && <p>No videos yet</p>}

      {videos.map((v) => (
        <div key={v._id} className="video-item">
          <span>{v.filename}</span>
          <span className={v.sensitivity}>{v.sensitivity}</span>
        </div>
      ))}

      <button className="logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

export default App;
