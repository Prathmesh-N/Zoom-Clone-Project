const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const envApiUrl = (process.env.REACT_APP_API_URL || "").trim();
const isEnvLocalUrl = envApiUrl.includes("localhost");

const server =
  !isLocalHost && isEnvLocalUrl
    ? "https://zoom-clone-backend-4b54.onrender.com"
    : envApiUrl ||
      (isLocalHost
        ? "http://localhost:8000"
        : "https://zoom-clone-backend-4b54.onrender.com");

export default server;
