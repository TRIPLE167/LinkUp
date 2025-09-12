 
let currentUserId = null;

self.addEventListener("message", (event) => {
 
  if (event.data && event.data.type === "SET_USER_ID") {
    currentUserId = event.data.userId;
  }
});

self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon,
    data: data.data,
  };

 

  if (currentUserId) {
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { data } = event.notification;
  if (data.chatId) {
    const url = `/home`;
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          let matchingClient = null;
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url.includes(url)) {
              matchingClient = client;
              break;
            }
          }
          if (matchingClient) {
            return matchingClient.focus();
          } else {
            return clients.openWindow(url);
          }
        })
    );
  }
});
