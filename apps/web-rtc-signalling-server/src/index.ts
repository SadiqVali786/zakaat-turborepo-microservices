import { WebSocketServer, WebSocket } from "ws";

// Create a WebSocket server on port 8080
const wss = new WebSocketServer({ port: 8080 });

// Variables to store sender and receiver sockets and their respective IDs
let senderSocket = null;
let receiverSocket = null;
let senderId = null;
let receiverId = null;

// Event listener for new connections to the WebSocket server
wss.on("connection", (ws: WebSocket) => {
  // Event listener for incoming messages from the client
  ws.on("message", (message: string) => {
    const parsedMessage = JSON.parse(message); // Parse the received message

    // Handle message based on its type
    if (parsedMessage.type === "sender") {
      // Assign the sender socket
      senderSocket = ws;
    } else if (parsedMessage.type === "receiver") {
      // Assign the receiver socket
      receiverSocket = ws;
    } else if (parsedMessage.type === "senderId") {
      // Assign the sender's ID and notify both sender and receiver if receiverId is already available
      senderId = parsedMessage.id;
      if (receiverId) {
        senderSocket.send(JSON.stringify({ type: "receiverId", id: receiverId }));
        receiverSocket.send(JSON.stringify({ type: "callerId", id: senderId }));
      }
    } else if (parsedMessage.type === "receiverId") {
      // Assign the receiver's ID and notify both receiver and sender if senderId is already available
      receiverId = parsedMessage.id;
      if (senderId) {
        receiverSocket.send(JSON.stringify({ type: "callerId", id: senderId }));
        senderSocket.send(JSON.stringify({ type: "receiverId", id: receiverId }));
      }
    }
  });

  // Event listener for when a client disconnects
  ws.on("close", () => {
    if (ws === senderSocket) {
      // Clear sender socket and ID when the sender disconnects
      senderSocket = null;
      senderId = null;
    } else if (ws === receiverSocket) {
      // Clear receiver socket and ID when the receiver disconnects
      receiverSocket = null;
      receiverId = null;
    }
  });
});

// Log that the WebSocket server has started
console.log("WebSocket server started on port 8080");
