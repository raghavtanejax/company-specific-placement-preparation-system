import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Editor } from '@monaco-editor/react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Code, PenTool, Users, Trash2 } from 'lucide-react';
import './PeerInterview.css';

const SOCKET_URL = import.meta.env.MODE === 'production' ? 'https://company-specific-placement-preparation.onrender.com' : 'http://localhost:5001';

const COLORS = ['#ffffff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff'];

const PeerInterview = () => {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'whiteboard'
  const [peerCount, setPeerCount] = useState(1); // Track connected peers
  
  // Media states
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // Code editor state
  const [code, setCode] = useState('// Welcome to collaborative coding\nfunction solution() {\n  \n}');

  // Whiteboard state
  const [penColor, setPenColor] = useState('#ffffff');
  const [penSize, setPenSize] = useState(3);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingsRef = useRef([]); // Store all drawing strokes
  const roomIdRef = useRef(''); // Keep roomId accessible in socket handlers
  
  // Refs for WebRTC and Sockets
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  
  // Attach local video when entering the room
  useEffect(() => {
    if (inRoom && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [inRoom]);

  // Initialize Socket.io (runs once)
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current.on('user-joined', async ({ socketId }) => {
      console.log('Another user joined:', socketId);
      setPeerCount(2);
      const peer = createPeer(socketId, socketRef.current.id, localStreamRef.current);
      peerRef.current = peer;
      
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('offer', {
          target: socketId,
          callerId: socketRef.current.id,
          sdp: offer
        });
      } catch (e) {
        console.error('Error creating explicit offer', e);
      }
    });

    socketRef.current.on('offer', async (payload) => {
      console.log('Received offer');
      setPeerCount(2);
      const peer = createPeer(payload.callerId, socketRef.current.id, localStreamRef.current);
      peerRef.current = peer;
      
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current.emit('answer', {
          target: payload.callerId,
          callerId: socketRef.current.id,
          sdp: answer
        });
      } catch (e) {
        console.error('Error handling offer', e);
      }
    });

    socketRef.current.on('answer', async (payload) => {
      console.log('Received answer');
      try {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
      } catch (e) {
        console.error('Error handling answer', e);
      }
    });

    socketRef.current.on('ice-candidate', async (incoming) => {
      try {
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(incoming.candidate));
        }
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    });

    socketRef.current.on('code-change', (newCode) => {
      setCode(newCode);
    });

    // Sync existing code when joining late
    socketRef.current.on('code-sync', (existingCode) => {
      console.log('Received code sync from server');
      setCode(existingCode);
    });

    // Receive drawing strokes from the peer
    socketRef.current.on('whiteboard-draw', (stroke) => {
      drawingsRef.current.push(stroke);
      drawStroke(stroke);
    });

    // Sync existing whiteboard when joining late
    socketRef.current.on('whiteboard-sync', (strokes) => {
      console.log('Received whiteboard sync from server:', strokes.length, 'strokes');
      drawingsRef.current = strokes;
      // If canvas is visible, redraw immediately
      redrawCanvas();
    });

    // Receive clear whiteboard from the peer
    socketRef.current.on('whiteboard-clear', () => {
      drawingsRef.current = [];
      clearCanvas();
    });

    return () => {
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peerRef.current?.close();
    };
  }, []);

  // Setup canvas when whiteboard tab is shown
  useEffect(() => {
    if (activeTab === 'whiteboard' && canvasRef.current) {
      resizeCanvas();
    }
  }, [activeTab]);

  // Handle window resize for canvas
  useEffect(() => {
    const handleResize = () => {
      if (activeTab === 'whiteboard' && canvasRef.current) {
        resizeCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    const toolbar = container.querySelector('.whiteboard-toolbar');
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 50;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - toolbarHeight;
    
    // Redraw all existing strokes after resize
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawingsRef.current.forEach(stroke => drawStroke(stroke));
  };

  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawingsRef.current.forEach(stroke => drawStroke(stroke));
  };

  const drawStroke = (stroke) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (stroke.points.length > 0) {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleCanvasMouseDown = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    lastPointRef.current = { color: penColor, size: penSize, points: [point] };
  };

  const handleCanvasMouseMove = (e) => {
    e.preventDefault();
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const point = getCanvasPoint(e);
    lastPointRef.current.points.push(point);
    
    // Draw locally in real-time
    const ctx = canvasRef.current.getContext('2d');
    const pts = lastPointRef.current.points;
    ctx.strokeStyle = lastPointRef.current.color;
    ctx.lineWidth = lastPointRef.current.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = (e) => {
    if (e) e.preventDefault();
    if (!isDrawingRef.current || !lastPointRef.current) return;
    isDrawingRef.current = false;
    
    const stroke = lastPointRef.current;
    drawingsRef.current.push(stroke);
    // Send the full stroke to the peer
    socketRef.current.emit('whiteboard-draw', { roomId: roomIdRef.current, stroke });
    lastPointRef.current = null;
  };

  const handleClearWhiteboard = () => {
    drawingsRef.current = [];
    clearCanvas();
    socketRef.current.emit('whiteboard-clear', { roomId: roomIdRef.current });
  };

  const createPeer = (targetId, callerId, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { 
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    });

    if (stream) {
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          target: targetId,
          candidate: event.candidate
        });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return peer;
  };

  const handleJoin = async () => {
    if (!roomId.trim()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      roomIdRef.current = roomId;
      setInRoom(true);
      socketRef.current.emit('join-room', roomId, 'user-id-temp');
    } catch (err) {
      console.error('Failed to get local stream', err);
      alert('Could not access camera/microphone');
    }
  };

  const toggleVideo = () => {
    const enabled = !isVideoOn;
    localStreamRef.current.getVideoTracks()[0].enabled = enabled;
    setIsVideoOn(enabled);
  };

  const toggleAudio = () => {
    const enabled = !isAudioOn;
    localStreamRef.current.getAudioTracks()[0].enabled = enabled;
    setIsAudioOn(enabled);
  };

  const handleLeave = () => {
    setInRoom(false);
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    window.location.reload();
  };

  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current.emit('code-change', { roomId: roomIdRef.current, code: value });
  };

  if (!inRoom) {
    return (
      <div className="peer-lobby">
        <div className="lobby-card glass-panel">
          <Users size={48} className="lobby-icon" />
          <h2>Peer-to-Peer Mock Interview</h2>
          <p>Collaborate in real-time with code, whiteboard, and video chat.</p>
          <input 
            type="text" 
            placeholder="Enter Room Code (e.g. room-123)" 
            value={roomId} 
            onChange={(e) => setRoomId(e.target.value)} 
            className="form-input"
          />
          <button className="btn btn-primary" onClick={handleJoin} disabled={!roomId}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="peer-room">
      <div className="room-topbar">
        <div className="room-info">
          <span className="room-badge">Room: {roomIdRef.current}</span>
          <div className="tab-switcher">
            <button className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}><Code size={16}/> Code</button>
            <button className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`} onClick={() => setActiveTab('whiteboard')}><PenTool size={16}/> Whiteboard</button>
          </div>
        </div>
        <div className="media-controls">
          <button className={`btn icon-btn ${isAudioOn ? 'btn-secondary' : 'btn-danger'}`} onClick={toggleAudio}>
            {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button className={`btn icon-btn ${isVideoOn ? 'btn-secondary' : 'btn-danger'}`} onClick={toggleVideo}>
            {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <button className="btn btn-danger icon-btn" onClick={handleLeave} title="Leave Room">
            <PhoneOff size={18} />
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="video-sidebar">
          <div className="video-container local">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span className="video-label">You</span>
          </div>
          <div className="video-container remote">
            <video ref={remoteVideoRef} autoPlay playsInline />
            <span className="video-label">Peer</span>
          </div>
        </div>

        <div className="workspace-area">
          {activeTab === 'code' ? (
            <div className="editor-wrapper glass-panel">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{ minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>
          ) : (
            <div className="whiteboard-wrapper glass-panel">
              <div className="whiteboard-toolbar">
                <div className="color-picker">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={`color-dot ${penColor === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setPenColor(color)}
                    />
                  ))}
                </div>
                <div className="size-picker">
                  <label>Size:</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={penSize} 
                    onChange={(e) => setPenSize(Number(e.target.value))}
                  />
                </div>
                <button className="btn btn-danger icon-btn clear-btn" onClick={handleClearWhiteboard} title="Clear Board">
                  <Trash2 size={16} /> <span className="clear-text">Clear</span>
                </button>
              </div>
              <canvas
                ref={canvasRef}
                className="whiteboard-canvas"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeerInterview;
