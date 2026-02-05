import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function LandingPage() {
  const router = useNavigate();
  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Connect Me</h2>
        </div>
        <div className="navList">
          <p
            onClick={() => {
              router("/mnbvc");
            }}
          >
            Join as Guest
          </p>
          <p
            onClick={() => {
              router("/auth");
            }}
          >
            Register
          </p>
          <div
            onClick={() => {
              router("/auth");
            }}
            role="button"
          >
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#ff9839" }}>Connect</span> with your Loved
            Ones
          </h1>
          <p>Cover a distance by <span style={{ color: "#ff9839" }}>Connect Me</span></p>
          <div role="button">
            <Link to="/auth">Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="Mobile Preview"></img>
        </div>
      </div>
    </div>
  );
}
