"use client";

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

const Receiver = () => {
  const [mounting, setMounting] = useState(false);
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const remoteVideoRef = useRef<null | HTMLVideoElement>(null);

  // Handle component mount and unmount
  useEffect(() => {
    setMounting(true);
    return () => setMounting(false);
  }, []);

  // Connect to the signaling server and establish peer connection
  useEffect(() => {
    const socket = new WebSocket("ws://192.168.1.7:8080");

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));

      const peer = new Peer();

      // Send receiver ID to the signaling server
      peer.on("open", (id) => {
        socket.send(JSON.stringify({ type: "receiverId", id }));
      });

      // Handle incoming call from sender
      peer.on("call", async (call) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          call.answer(stream); // Answer with the local stream

          // Assign the local stream to the local video element
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }

          call.on("stream", (remoteStream) => {
            // Assign the remote stream to the remote video element
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play();
            }
          });

          // Enable two-way streaming by calling the sender back
          const senderId = call.peer;
          peer.call(senderId, stream);
        } catch (err) {
          console.error("Failed to get local stream", err);
        }
      });
    };
  }, []);

  // Display loading message while mounting
  if (!mounting) return <div>Mounting</div>;

  return (
    <div className="min-h-screen min-w-screen flex flex-col justify-center items-center">
      <video ref={videoRef} playsInline autoPlay muted className="fixed top-0 right-0 z-20 w-[25%]" />
      <video ref={remoteVideoRef} playsInline autoPlay className="object-fit h-full w-full" />
    </div>
  );
};

export default Receiver;
