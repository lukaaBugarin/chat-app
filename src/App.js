import "./App.css";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

function randomColor() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16);
}
function App() {
  const roomName = "observable-room";
  const channelId = "idaMNKrgwcCPuYul";

  const [member, setMember] = useState({
    id: null,
    name: "",
    color: randomColor(),
  });
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState({ text: "" });
  const [drone, setDrone] = useState(null);
  const [usersInChat, setUsersInChat] = useState([]);

  const handleNameSubmit = (event) => {
    event.preventDefault();
    if (!member.name) {
      return;
    }
    const newMember = {
      id: uuidv4(),
      name: member.name,
      color: member.color,
    };
    setMember(newMember);
  };
  useEffect(() => {
    if (!member.id) {
      return;
    }

    const drone = new window.Scaledrone(channelId, {
      data: member,
    });

    drone.on("open", (error) => {
      if (error) {
        return console.error(error);
      }
    });

    const room = drone.subscribe(roomName);

    room.on("data", (data, sender) => {
      if (
        sender &&
        sender.id &&
        !usersInChat.some((user) => user.id === sender.id)
      ) {
        setUsersInChat((prevUsers) => [...prevUsers, sender.clientData]);
      }

      const messageData = {
        text: typeof data === "string" ? data : data.text,
        sender: sender
          ? sender.clientData
          : { name: "Unknown", color: randomColor() },
      };

      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some(
          (msg) =>
            msg.text === messageData.text &&
            msg.sender.id === messageData.sender.id
        );
        if (!isDuplicate) {
          return [...prevMessages, messageData];
        }
        return prevMessages;
      });
    });

    setDrone(drone);

    return () => {
      drone.close();
    };
     // eslint-disable-next-line
  }, [member.id, usersInChat]);

  const handleSendMessage = (message) => {
    if (!message || !drone) {
      return;
    }
    drone.publish({
      room: roomName,
      message,
    });
    setLastMessage({ text: "" });
  };

  const handleMessageInputChange = (event) => {
    setLastMessage({ text: event.target.value });
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSendMessage(lastMessage.text);
    }
  };

  return (
    <div className="App">
      {!member.id ? (
        <form className="name-form" onSubmit={handleNameSubmit}>
          <h1>Welcome to the Chat App!</h1>
          <label>
            Enter your name:
            <input
              className="input-name"
              value={member.name}
              onChange={(event) =>
                setMember({ ...member, name: event.target.value })
              }
              placeholder="Your name"
            />
          </label>
          <button type="submit">Join Chat</button>
        </form>
      ) : (
        <div className="chat-room">
          <div className="messages">
            {messages.map((message, index) => (
              <div
                key={index}
                style={{ color: message.sender.color }}
                className={`message ${
                  message.sender.id === member.id
                    ? "message-sent"
                    : "message-received"
                }`}
              >
                <div className="message-author">{message.sender.name}</div>
                <div className="message-text">{message.text}</div>
              </div>
            ))}
          </div>
          <div className="input-container">
            <input
              className="input-message"
              value={lastMessage.text}
              onChange={handleMessageInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <button
              className="send-button"
              onClick={() => handleSendMessage(lastMessage.text)}
            >
              &rsaquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
