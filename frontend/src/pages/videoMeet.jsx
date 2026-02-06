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

var connections = {};

const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun1.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(false);
  let [audio, setAudio] = useState(false);
  let [screen, setScreen] = useState(false);
  let [showModal, setShowModal] = useState(true);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askforUsername, setAskforUsername] = useState(true);
  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  const getPermissions = async (retryCount = 0) => {
    try {
      // Check screen share availability
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      // Request both video and audio together
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });

        if (userMediaStream) {
          setVideoAvailable(true);
          setAudioAvailable(true);
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
          return; // Success!
        }
      } catch (err) {
        console.log("Error getting video+audio:", err);

        // Retry up to 2 times with increasing delays
        if (retryCount < 2) {
          console.log(`Retrying... (attempt ${retryCount + 1})`);
          await new Promise((resolve) => setTimeout(resolve, 1500 * (retryCount + 1)));
          return getPermissions(retryCount + 1);
        }
      }

      // Try video only as fallback
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        setVideoAvailable(true);
        setAudioAvailable(false);
        window.localStream = videoStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = videoStream;
        }
      } catch (videoErr) {
        console.log("Error getting video only:", videoErr);
        
        // Try audio only
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setVideoAvailable(false);
          setAudioAvailable(true);
          window.localStream = audioStream;
        } catch (audioErr) {
          console.log("Error getting audio only:", audioErr);
          setVideoAvailable(false);
          setAudioAvailable(false);
          
          // Create black/silence stream as fallback
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          if (localVideoRef.current && window.localStream) {
            localVideoRef.current.srcObject = window.localStream;
          }
        }
      }
    } catch (err) {
      console.log("Error in getPermissions:", err);
    }
  };

  useEffect(() => {
    // Don't request camera on page load, only check screen share
    if (navigator.mediaDevices.getDisplayMedia) {
      setScreenAvailable(true);
    } else {
      setScreenAvailable(false);
    }
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream && window.localStream !== stream) {
        window.localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    } catch (err) {
      console.log(err);
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      
      // Remove old senders before adding new tracks
      connections[id].getSenders().forEach((sender) => {
        if (sender.track && (sender.track.kind === "video" || sender.track.kind === "audio")) {
          try {
            connections[id].removeTrack(sender);
          } catch (err) {
            console.log("Error removing track:", err);
          }
        }
      });

      // Add new tracks
      stream.getTracks().forEach((track) => {
        try {
          connections[id].addTrack(track, stream);
        } catch (err) {
          console.log("Error adding track:", err);
        }
      });

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            if (socketRef.current) {
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({ sdp: connections[id].localDescription }),
              );
            }
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);

        try {
          let tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        } catch (err) {
          console.log(err);
        }
        let blackSilence = (...args) =>
          new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        localVideoRef.current.srcObject = window.localStream;

        for (let id in connections) {
          // Remove old senders first
          connections[id].getSenders().forEach((sender) => {
            if (sender.track && (sender.track.kind === "video" || sender.track.kind === "audio")) {
              try {
                connections[id].removeTrack(sender);
              } catch (err) {
                console.log("Error removing track:", err);
              }
            }
          });

          // Add new tracks
          window.localStream.getTracks().forEach((track) => {
            try {
              connections[id].addTrack(track, window.localStream);
            } catch (err) {
              console.log("Error adding track:", err);
            }
          });
          connections[id].createOffer().then((description) => {
            connections[id]
              .setLocalDescription(description)
              .then(() => {
                if (socketRef.current) {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                }
              })
              .catch((e) => console.log(e));
          });
        }
      };
    });
  };

  let silence = () => {
    let context = new AudioContext();
    let oscillator = context.createOscillator();
    let dst = oscillator.connect(context.createMediaStreamDestination());

    oscillator.start();
    context.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      // If we already have a stream from getPermissions(), just use it
      if (window.localStream && window.localStream.getTracks().length > 0) {
        getUserMediaSuccess(window.localStream);
        return;
      }

      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((err) => {
          console.log("Error getting user media:", err);
          if (err.name === "NotReadableError") {
            console.warn("Camera/microphone not available. Using fallback.");
            // Use black/silence fallback
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            getUserMediaSuccess(window.localStream);
          }
        });
    } else {
      try {
        let tracks = localVideoRef.current.srcObject?.getTracks();
        if (tracks) {
          tracks.forEach((track) => track.stop());
        }
      } catch (err) {}
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      if (socketRef.current) {
                        socketRef.current.emit(
                          "signal",
                          fromId,
                          JSON.stringify({
                            sdp: connections[fromId].localDescription,
                          }),
                        );
                      }
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      if (signal.ice) {
        if (connections[fromId].remoteDescription) {
          connections[fromId]
            .addIceCandidate(new RTCIceCandidate(signal.ice))
            .catch((e) => console.log(e));
        }
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender: sender,
        data: data,
      },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(serverURL, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-messages", addMessage);
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });
      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConnectionConfig,
          );
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              if (socketRef.current) {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({
                    ice: event.candidate,
                  }),
                );
              }
            }
          };
          connections[socketListId].ontrack = (event) => {
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId,
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.streams[0] }
                    : video,
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.streams[0],
                autoPlay: true,
                playsInline: true,
              };
              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            window.localStream.getTracks().forEach((track) => {
              connections[socketListId].addTrack(track, window.localStream);
            });
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            window.localStream.getTracks().forEach((track) => {
              connections[socketListId].addTrack(track, window.localStream);
            });
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 !== socketIdRef.current) continue;
            try {
              if (window.localStream !== undefined && window.localStream !== null) {
                window.localStream.getTracks().forEach((track) => {
                  connections[id2].addTrack(track, window.localStream);
                });
              }
            } catch (err) {}
            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  if (socketRef.current) {
                    socketRef.current.emit(
                      "signal",
                      id2,
                      JSON.stringify({ sdp: connections[id2].localDescription }),
                    );
                  }
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let routeTo = useNavigate();

  let connect = () => {
    setAskforUsername(false);
    // Request camera permissions when user clicks Connect
    getPermissions().then(() => {
      getMedia();
    }).catch((err) => {
      console.log("Error getting permissions:", err);
      // Proceed without camera, use black/silence
      getMedia();
    });
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.log(err);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      
      // Remove old senders before adding new tracks
      connections[id].getSenders().forEach((sender) => {
        if (sender.track && (sender.track.kind === "video" || sender.track.kind === "audio")) {
          try {
            connections[id].removeTrack(sender);
          } catch (err) {
            console.log("Error removing track:", err);
          }
        }
      });

      // Add new tracks
      stream.getTracks().forEach((track) => {
        try {
          connections[id].addTrack(track, stream);
        } catch (err) {
          console.log("Error adding track:", err);
        }
      });

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            if (socketRef.current) {
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({ sdp: connections[id].localDescription }),
              );
            }
          })
          .catch((e) => console.log(e));
      });
    }
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);

        try {
          let tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        } catch (err) {
          console.log(err);
        }

        let blackSilence = (...args) =>
          new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        localVideoRef.current.srcObject = window.localStream;

        getUserMedia();
      };
    });
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((err) => console.log(err));
      }
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleMessages = () => {
    setShowModal(!showModal);
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (err) {
      console.log(err);
    }
    routeTo("/home");
  };

  return (
    <div>
      {askforUsername === true ? (
        <div className={styles.lobbyScreen}>
          <div className={styles.lobbyCard}>
            <p className={styles.lobbyEyebrow}>Secure video meetings</p>
            <h2>Enter the lobby</h2>
            <p className={styles.lobbySubText}>
              Preview your camera and join when you're ready.
            </p>
            <div className={styles.lobbyControls}>
              <TextField
                className={styles.lobbyField}
                id="outlined-basic"
                label="Username"
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
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "0.75rem" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
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
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}
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
          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
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
