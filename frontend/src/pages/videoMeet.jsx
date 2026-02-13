import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/videoMeet.module.css";
import { TextField, Button, IconButton, Badge } from "@mui/material";
import io from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";
import server from "../envirnoment";

const serverURL = server;

const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun1.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const connectionsRef = useRef({});
  const pendingIceRef = useRef({});
  const chatDisplayRef = useRef(null);

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(false);
  const [screen, setScreen] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askforUsername, setAskforUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  const routeTo = useNavigate();

  const silence = () => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const dst = oscillator.connect(context.createMediaStreamDestination());
    oscillator.start();
    context.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    canvas.getContext("2d").fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const createBlackSilenceStream = () =>
    new MediaStream([black(), silence()]);

  const setLocalStream = (stream) => {
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const removeTrackSenders = (peerConnection) => {
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track && (sender.track.kind === "video" || sender.track.kind === "audio")) {
        try {
          peerConnection.removeTrack(sender);
        } catch (err) {
          console.log("Error removing track:", err);
        }
      }
    });
  };

  const attachLocalTracks = (peerId, stream) => {
    const peerConnection = connectionsRef.current[peerId];
    if (!peerConnection || !stream) {
      return;
    }

    removeTrackSenders(peerConnection);
    stream.getTracks().forEach((track) => {
      try {
        peerConnection.addTrack(track, stream);
      } catch (err) {
        console.log("Error adding track:", err);
      }
    });
  };

  const renegotiatePeer = (peerId) => {
    const peerConnection = connectionsRef.current[peerId];
    if (!peerConnection || peerId === socketIdRef.current) {
      return;
    }

    peerConnection
      .createOffer()
      .then((description) => peerConnection.setLocalDescription(description))
      .then(() => {
        if (!socketRef.current) {
          return;
        }
        socketRef.current.emit(
          "signal",
          peerId,
          JSON.stringify({ sdp: peerConnection.localDescription }),
        );
      })
      .catch((err) => console.log(err));
  };

  const flushPendingIce = (peerId) => {
    const peerConnection = connectionsRef.current[peerId];
    const queuedCandidates = pendingIceRef.current[peerId] || [];
    if (!peerConnection || !peerConnection.remoteDescription || queuedCandidates.length === 0) {
      return;
    }

    queuedCandidates.forEach((candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
        console.log(err);
      });
    });
    pendingIceRef.current[peerId] = [];
  };

  const upsertRemoteVideo = (peerId, stream) => {
    setVideos((prevVideos) => {
      const existingIndex = prevVideos.findIndex(
        (entry) => entry.socketId === peerId,
      );

      if (existingIndex !== -1) {
        return prevVideos.map((entry) =>
          entry.socketId === peerId ? { ...entry, stream } : entry,
        );
      }

      return [
        ...prevVideos,
        {
          socketId: peerId,
          stream,
          autoPlay: true,
          playsInline: true,
        },
      ];
    });
  };

  const setupPeerConnection = (peerId) => {
    if (!peerId || connectionsRef.current[peerId]) {
      return connectionsRef.current[peerId];
    }

    const peerConnection = new RTCPeerConnection(peerConnectionConfig);

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current) {
        return;
      }

      socketRef.current.emit(
        "signal",
        peerId,
        JSON.stringify({ ice: event.candidate }),
      );
    };

    peerConnection.ontrack = (event) => {
      upsertRemoteVideo(peerId, event.streams[0]);
    };

    connectionsRef.current[peerId] = peerConnection;
    pendingIceRef.current[peerId] = pendingIceRef.current[peerId] || [];

    return peerConnection;
  };

  const getPermissions = async (retryCount = 0) => {
    try {
      setScreenAvailable(Boolean(navigator.mediaDevices.getDisplayMedia));

      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });

        if (userMediaStream) {
          setVideoAvailable(true);
          setAudioAvailable(true);
          setLocalStream(userMediaStream);
          return;
        }
      } catch (err) {
        console.log("Error getting video+audio:", err);
        if (retryCount < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * (retryCount + 1)));
          return getPermissions(retryCount + 1);
        }
      }

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        setVideoAvailable(true);
        setAudioAvailable(false);
        setLocalStream(videoStream);
      } catch (videoErr) {
        console.log("Error getting video only:", videoErr);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setVideoAvailable(false);
          setAudioAvailable(true);
          setLocalStream(audioStream);
        } catch (audioErr) {
          console.log("Error getting audio only:", audioErr);
          setVideoAvailable(false);
          setAudioAvailable(false);
          setLocalStream(createBlackSilenceStream());
        }
      }
    } catch (err) {
      console.log("Error in getPermissions:", err);
    }
  };

  useEffect(() => {
    setScreenAvailable(Boolean(navigator.mediaDevices.getDisplayMedia));
  }, []);

  const updateStreamForPeers = (stream) => {
    Object.keys(connectionsRef.current).forEach((peerId) => {
      if (peerId === socketIdRef.current) {
        return;
      }
      attachLocalTracks(peerId, stream);
      renegotiatePeer(peerId);
    });
  };

  const getUserMediaSuccess = (stream) => {
    try {
      if (localStreamRef.current && localStreamRef.current !== stream) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      console.log(err);
    }

    setLocalStream(stream);
    updateStreamForPeers(stream);

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);
        const blackSilenceStream = createBlackSilenceStream();
        setLocalStream(blackSilenceStream);
        updateStreamForPeers(blackSilenceStream);
      };
    });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video, audio })
        .then(getUserMediaSuccess)
        .catch((err) => {
          console.log("Error getting user media:", err);
          getUserMediaSuccess(createBlackSilenceStream());
        });
      return;
    }

    getUserMediaSuccess(createBlackSilenceStream());
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  const gotMessageFromServer = (fromId, messagePayload) => {
    let signal;
    try {
      signal = JSON.parse(messagePayload);
    } catch (err) {
      console.log("Invalid signaling payload", err);
      return;
    }

    if (fromId === socketIdRef.current) {
      return;
    }

    const peerConnection = setupPeerConnection(fromId);

    if (signal.sdp) {
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          flushPendingIce(fromId);
          if (signal.sdp.type !== "offer") {
            return;
          }

          return peerConnection
            .createAnswer()
            .then((description) => peerConnection.setLocalDescription(description))
            .then(() => {
              if (!socketRef.current) {
                return;
              }
              socketRef.current.emit(
                "signal",
                fromId,
                JSON.stringify({ sdp: peerConnection.localDescription }),
              );
            });
        })
        .catch((err) => console.log(err));
    }

    if (signal.ice) {
      if (peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((err) => {
          console.log(err);
        });
      } else {
        pendingIceRef.current[fromId] = pendingIceRef.current[fromId] || [];
        pendingIceRef.current[fromId].push(signal.ice);
      }
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender, data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((count) => count + 1);
    }
  };

  const cleanupPeer = (peerId) => {
    const peerConnection = connectionsRef.current[peerId];
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch (err) {
        console.log(err);
      }
      delete connectionsRef.current[peerId];
    }
    delete pendingIceRef.current[peerId];
    setVideos((prevVideos) => prevVideos.filter((entry) => entry.socketId !== peerId));
  };

  const cleanupCall = () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      console.log(err);
    }

    Object.keys(connectionsRef.current).forEach((peerId) => {
      cleanupPeer(peerId);
    });

    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (err) {
        console.log(err);
      }
    }

    localStreamRef.current = null;
    socketRef.current = null;
    socketIdRef.current = null;
    connectionsRef.current = {};
    pendingIceRef.current = {};
  };

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (!showModal || !chatDisplayRef.current) {
      return;
    }
    chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
  }, [messages, showModal]);

  const connectToSocketServer = () => {
    if (socketRef.current?.connected) {
      return;
    }

    socketRef.current = io.connect(serverURL, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("chat-messages", addMessage);
    socketRef.current.on("user-left", (id) => {
      cleanupPeer(id);
    });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", window.location.pathname);
    });

    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((socketListId) => {
        if (socketListId === socketIdRef.current) {
          return;
        }
        setupPeerConnection(socketListId);
        if (localStreamRef.current) {
          attachLocalTracks(socketListId, localStreamRef.current);
        }
      });

      if (id === socketIdRef.current) {
        Object.keys(connectionsRef.current).forEach((peerId) => {
          if (peerId !== socketIdRef.current) {
            renegotiatePeer(peerId);
          }
        });
      }
    });
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const connect = () => {
    setAskforUsername(false);
    getPermissions()
      .then(() => {
        getMedia();
      })
      .catch((err) => {
        console.log("Error getting permissions:", err);
        getMedia();
      });
  };

  const handleVideo = () => {
    setVideo((prevState) => !prevState);
  };

  const handleAudio = () => {
    setAudio((prevState) => !prevState);
  };

  const getDisplayMediaSuccess = (stream) => {
    getUserMediaSuccess(stream);
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);
        getUserMedia();
      };
    });
  };

  const getDisplayMedia = () => {
    if (!screen || !navigator.mediaDevices.getDisplayMedia) {
      return;
    }

    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then(getDisplayMediaSuccess)
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  const handleScreen = () => {
    setScreen((prevState) => {
      const nextState = !prevState;
      if (!nextState) {
        const hadDisplayTrack = Boolean(
          localStreamRef.current?.getVideoTracks().some((track) => {
            const settings = typeof track.getSettings === "function" ? track.getSettings() : {};
            return Boolean(settings.displaySurface);
          }),
        );

        if (hadDisplayTrack) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        getUserMedia();
      }
      return nextState;
    });
  };

  const handleMessages = () => {
    setShowModal((prevState) => !prevState);
    setNewMessages(0);
  };

  const sendMessage = () => {
    if (!socketRef.current || !message.trim()) {
      return;
    }
    socketRef.current.emit("chat-message", message.trim(), username.trim() || "Guest");
    setMessage("");
  };

  const handleEndCall = () => {
    cleanupCall();
    routeTo("/home");
  };

  return (
    <div>
      {askforUsername ? (
        <div className={styles.lobbyScreen}>
          <div className={styles.lobbyCard}>
            <p className={styles.lobbyEyebrow}>Secure video meetings</p>
            <h2>Enter the lobby</h2>
            <p className={styles.lobbySubText}>
              Preview your camera and join when you&apos;re ready.
            </p>
            <div className={styles.lobbyControls}>
              <TextField
                className={styles.lobbyField}
                id="outlined-basic"
                label="Full name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                size="small"
              />
              <Button
                className={styles.lobbyBtn}
                variant="contained"
                onClick={connect}
              >
                Connect
              </Button>
            </div>
            <div className={styles.lobbyPreview}>
              <video ref={localVideoRef} autoPlay muted></video>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.ChatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay} ref={chatDisplayRef}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginBottom: "0.75rem" }} key={index}>
                        <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No messages yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your Chat"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            ) : null}
            <Badge badgeContent={newMessages} max={999} color="primary">
              <IconButton onClick={handleMessages} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>
          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
          ></video>
          <div
            className={`${styles.conferenceView} ${showModal ? styles.conferenceWithChat : ""}`}
          >
            {videos.map((remoteVideo) => (
              <div key={remoteVideo.socketId}>
                <video
                  data-socket={remoteVideo.socketId}
                  ref={(ref) => {
                    if (ref && remoteVideo.stream) {
                      ref.srcObject = remoteVideo.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
