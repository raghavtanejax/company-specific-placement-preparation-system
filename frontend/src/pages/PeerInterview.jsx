import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Editor } from '@monaco-editor/react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Code, PenTool, Users } from 'lucide-react';
import './PeerInterview.css';

const SOCKET_URL = import.meta.env.MODE === 'production' ? 'https://company-specific-placement-preparation.onrender.com' : 'http://localhost:5001';

const PeerInterview = () => {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'whiteboard'
  
  // Media states
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // Code editor state
  const [code, setCode] = useState('// Welcome to collaborative coding\nfunction solution() {\n  \n}');
  
  // Refs for WebRTC and Sockets
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  
  useEffect(() => {
    if (inRoom && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [inRoom]);

  useEffect(() => {
    // Initialize Socket.io
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('user-joined', async ({ socketId }) => {
      console.log('Another user joined:', socketId);
      // We are the caller (already in room)
      const peer = createPeer(socketId, socketRef.current.id, localStreamRef.current);
      peerRef.current = peer;
    });

    socketRef.current.on('offer', async (payload) => {
      console.log('Received offer');
      const peer = createPeer(payload.callerId, socketRef.current.id, localStreamRef.current);
      peerRef.current = peer;
      await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current.emit('answer', {
        target: payload.callerId,
        callerId: socketRef.current.id,
        sdp: answer
      });
    });

    socketRef.current.on('answer', async (payload) => {
      console.log('Received answer');
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
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

    return () => {
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peerRef.current?.close();
    };
  }, []);

  const createPeer = (targetId, callerId, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
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

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('offer', {
          target: targetId,
          callerId: callerId,
          sdp: offer
        });
      } catch (e) {
        console.error('Error creating offer', e);
      }
    };

    return peer;
  };

  const handleJoin = async () => {
    if (!roomId.trim()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setInRoom(true);
      socketRef.current.emit('join-room', roomId, 'user-id-temp'); // Can pass actual user ID
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
    window.location.reload(); // Quick reset
  };

  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current.emit('code-change', { roomId, code: value });
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
          <span className="room-badge">Room: {roomId}</span>
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
                options={{ minimap: { enabled: false }, fontSize: 16 }}
              />
            </div>
          ) : (
            <div className="whiteboard-wrapper glass-panel">
              <Excalidraw 
                theme="dark" 
                onChange={(elements) => {
                  // Debounce this in production, simple emit for demo
                  socketRef.current.emit('whiteboard-change', { roomId, elements });
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeerInterview;
