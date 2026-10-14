/** Side-effect-free runtime configuration, registered once by the consuming application. */
import type { RailApplication } from './app/application';

const application: RailApplication = {};
/** Register extensions before mounting the application; shared imports never load host modules. */
export function configureApplication(config: RailApplication): void {
  for (const key of Object.keys(application)) delete application[key];
  Object.assign(application, config);
}
export default application;
