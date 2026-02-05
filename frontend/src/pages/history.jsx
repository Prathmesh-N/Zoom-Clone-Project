import React from "react";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";

export function History() {
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);

  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        // Something edit here
        setMeetings(Array.isArray(history) ? history : []);
      } catch (err) {
        //implement snackbar here
        setMeetings([]);
      }
    };
    fetchHistory();
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(1100px 600px at 12% -15%, #fff2de 0%, transparent 60%), linear-gradient(160deg, #f7f4ef 0%, #f3efe8 100%)",
        color: "#1e1e1e",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily:
                '"Playfair Display", Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontSize: { xs: "1.6rem", md: "2rem" },
              mb: 0.5,
            }}
          >
            Meeting History
          </Typography>
          <Typography sx={{ color: "#6b6b6b" }}>
            A quick view of your recent sessions.
          </Typography>
        </Box>
        <IconButton
          onClick={() => {
            routeTo("/home");
          }}
          sx={{
            border: "1px solid #e6e0d8",
            borderRadius: 2,
            bgcolor: "#ffffff",
          }}
        >
          <HomeIcon />
        </IconButton>
      </Box>

      {meetings.length !== 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 2,
          }}
        >
          {meetings.map((meeting, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "#e6e0d8",
                boxShadow: "0 14px 40px rgba(30, 30, 30, 0.12)",
              }}
            >
              <CardContent>
                <Typography
                  gutterBottom
                  sx={{ color: "#6b6b6b", fontSize: 13, letterSpacing: "0.1em" }}
                >
                  MEETING CODE
                </Typography>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {meeting.meetingCode}
                </Typography>
                <Typography sx={{ color: "#6b6b6b" }}>
                  Date: {formatDate(meeting.date)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            background: "#ffffff",
            border: "1px solid #e6e0d8",
            borderRadius: 3,
            p: 3,
            maxWidth: 520,
          }}
        >
          <Typography
            sx={{
              fontFamily:
                '"Playfair Display", Georgia, "Times New Roman", serif',
              fontSize: "1.4rem",
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            No Meetings Yet
          </Typography>
          <Typography sx={{ color: "#6b6b6b" }}>
            When you join or host a call, it will appear here.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
