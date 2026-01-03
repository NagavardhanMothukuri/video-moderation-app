import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

const API = "https://video-moderation-app.onrender.com";

const socket = io(API);

export default function App() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [videos, setVideos] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    socket.on("progress", (data) => {
      setProgress(data.progress);
      if (data.progress >= 100) setUploading(false);
    });
    return () => socket.off("progress");
  }, []);

  const login = async () => {
    const res = await axios.post(`${API}/login`, { email, password });
    setToken(res.data.token);
  };

  const uploadVideo = async (e) => {
    setUploading(true);
    setProgress(0);
    const form = new FormData();
    form.append("video", e.target.files[0]);
    await axios.post(`${API}/upload`, form, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const loadVideos = async () => {
    const res = await axios.get(`${API}/videos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setVideos(res.data);
  };

  return (
    <div className="rog-app">
      <header className="rog-hero">
        <h1>VIDEO MODERATION SYSTEM</h1>
        <p>Upload • Analyze • Stream • Review</p>
      </header>

      {!token && (
        <div className="rog-login">
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <button onClick={login}>ENTER DASHBOARD</button>
        </div>
      )}

      {token && (
        <>
          <section className="rog-upload">
            <h2>Upload Video</h2>
            <input type="file" accept="video/mp4" onChange={uploadVideo} disabled={uploading} />

            <div className="rog-progress">
              <div className="rog-progress-bar" style={{ width: `${progress}%` }}>
                {progress}%
              </div>
            </div>

            <button onClick={loadVideos}>Refresh Library</button>
          </section>

          <section className="rog-grid">
            {videos.map(v => (
              <div key={v._id} className="rog-card">
                <span className={`rog-badge ${v.sensitivity}`}>
                  {v.sensitivity.toUpperCase()}
                </span>
                <span className="rog-status">{v.status}</span>

                {v.status === "done" && (
                  <video
                    controls
                    preload="metadata"
                    src={`${API}/stream/${v.filename}`}
                  />
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
