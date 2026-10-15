/** Optional application notification menu; no backend notification model is assumed. */
import application from '@rail/application';
export function NavNotifications() {
  const Notifications = application.slots?.Notifications;
  return Notifications ? <Notifications /> : null;
}
