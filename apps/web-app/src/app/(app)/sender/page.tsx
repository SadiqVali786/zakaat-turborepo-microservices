"use client";

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import Button from "@repo/ui/button";

const Sender = () => {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState(true); // Call state (true: initiate, false: ongoing call)
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const remoteVideoRef = useRef<null | HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const remotePeerId = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Handle component mount and unmount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Connect to the signaling server, establish peer connection, and listen for receiver ID
  useEffect(() => {
    const socket = new WebSocket("ws://192.168.1.7:8080");

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));

      const peer = new Peer();
      peerRef.current = peer;

      peer.on("open", (id) => {
        socket.send(JSON.stringify({ type: "senderId", id }));
      });

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "receiverId") {
          remotePeerId.current = message.id;
        }
      };

      // Handle incoming call from receiver
      peer.on("call", async (call) => {
        try {
          if (!localStreamRef.current) {
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          }
          call.answer(localStreamRef.current); // Answer the call with the local stream

          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play();
            }
          });
        } catch (err) {
          console.error("Failed to get local stream", err);
        }
      });
    };
  }, []);

  // Initiate a call to the receiver
  const initiateCall = async () => {
    if (!peerRef.current || !remotePeerId.current) return;

    try {
      if (!localStreamRef.current) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
        videoRef.current.play();
      }
      peerRef.current.call(remotePeerId.current, localStreamRef.current);
      setState(false); // Update call state to ongoing
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  };

  // Display loading message while mounting
  if (!mounted) return <div>Mounting</div>;

  return (
    <div className="min-w-screen flex min-h-screen flex-col items-center justify-center">
      {state && <Button onClick={initiateCall}>Call Brother</Button>}
      <video ref={videoRef} playsInline autoPlay muted className="fixed right-0 top-0 z-20 w-[25%]" />
      <video ref={remoteVideoRef} playsInline autoPlay className="object-fit h-full w-full" />
    </div>
  );
};

export default Sender;
