import api from './api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const keyRes = await api.get('/push/vapid-public-key')
    const publicKey = keyRes.data.publicKey

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })

    const sub = subscription.toJSON()
    await api.post('/push/subscribe', {
      endpoint: sub.endpoint,
      p256dh: sub.keys?.p256dh || '',
      auth: sub.keys?.auth || '',
    })

    return true
  } catch (err) {
    console.error('Error subscrivint a push:', err)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return

    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await api.post('/push/unsubscribe', { endpoint })
  } catch (err) {
    console.error('Error eliminant subscripció push:', err)
  }
}
