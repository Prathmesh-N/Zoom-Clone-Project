const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const envApiUrl = (process.env.REACT_APP_API_URL || "").trim();
const isEnvLocalUrl = envApiUrl.includes("localhost");

const server =
  !isLocalHost && isEnvLocalUrl
    ? "https://zoom-clone-backend-xp1r.onrender.com"
    : envApiUrl ||
      (isLocalHost
        ? "http://localhost:8000"
        : "https://zoom-clone-backend-xp1r.onrender.com");

export default server;
