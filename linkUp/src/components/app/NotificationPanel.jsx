import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import "../../styles/notification.scss";

const NotificationPanel = ({ isNotifOpen, setIsNotifOpen }) => {
  const navigate = useNavigate();
  const { notifications } = useChat();
  return (
    <>
      <div className={`notification-panel ${isNotifOpen ? "open" : ""}`}>
        <h2>Notifications</h2>

        <div className="users">
          {notifications.length > 0 ? (
            notifications.map((notificationData, index) => (
              <div
                key={notificationData._id || index}
                className="user-result"
                onClick={() => {
                  navigate(`/profile/${notificationData.content.userName}`);
                  setIsNotifOpen(false);
                }}
              >
                <img src={notificationData.content.avatar || "/Bg.png"} />

                <h5>
                  {(() => {
                    const words = notificationData.text.split(" ");
                    const username = words[0];  
                    const action = words.slice(1).join(" ");  

                    return (
                      <>
                        <span> {username}</span>
                        <span className="highlight">{action}</span>
                      </>
                    );
                  })()}
                </h5>

                <p>
                  {notificationData.createdAt
                    ? new Date(notificationData.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
            ))
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <p>No Notifications.</p>
            </div>
          )}
        </div>
      </div>
      <div
        className={`background-button ${isNotifOpen ? "open" : ""}`}
        onClick={() => setIsNotifOpen(false)}
      ></div>
    </>
  );
};

export default NotificationPanel;
