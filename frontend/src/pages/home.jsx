import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);
  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="homePage">
      <div className="navbar">
        <div className="brand">
          <span className="brandDot" />
          <h2>ConnectMe</h2>
        </div>
        <div className="navActions">
          <IconButton className="navButton" onClick={() => navigate("/history")}>
            <RestoreIcon />
            <span>History</span>
          </IconButton>
          <Button
            className="logoutBtn"
            variant="outlined"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="meetContainer">
        <div className="leftPanel">
          <div className="heroCard">
            <p className="eyebrow">Secure video meetings</p>
            <h2>Providing Quality Video Call Just Like Quality Education</h2>
            <div className="joinRow">
              <TextField
                className="joinField"
                onChange={(e) => setMeetingCode(e.target.value)}
                id="outlined-basic"
                label="Meeting Code"
                variant="outlined"
                size="small"
              />
              <Button
                className="joinBtn"
                variant="contained"
                onClick={handleJoinVideoCall}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <div className="mediaFrame">
            <img srcSet="/logo3.png" alt="video meeting illustration" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
