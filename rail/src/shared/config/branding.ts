/** Product branding supplied by the application, with neutral defaults. */
import application from '@rail/application';
import defaultLogo from '../assets/rail.svg';
export const BRANDING = {
  get productName() { return application.branding?.productName ?? 'Rail'; },
  get productNameLong() { return application.branding?.productNameLong ?? application.branding?.productName ?? 'Rail'; },
  get logo() { return application.branding?.logo ?? defaultLogo; },
  get logoAlt() { return application.branding?.logoAlt ?? 'Logo'; },
  get description() { return application.branding?.description ?? 'Votre espace de travail'; },
  get subtitle() { return application.branding?.subtitle ?? ''; },
  editionLabel: '', platformLabel: '', hubLabel: '',
};
export const SYSTEM_STATUS = { connectedLabel: 'Connecté', latencyRegionLabel: '' } as const;
