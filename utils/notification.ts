export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("此瀏覽器不支持通知功能")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: "/logo.png",
      badge: "/logo.png",
      ...options,
    })

    notification.onclick = function() {
      window.focus()
      notification.close()
    }
  }
} 