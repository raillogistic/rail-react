/** Optional application AI settings page. */
import application from '@rail/application';
export function AiSettingsPage() {
  const Page = application.slots?.AiSettings;
  return Page ? <Page /> : null;
}
export default AiSettingsPage;
