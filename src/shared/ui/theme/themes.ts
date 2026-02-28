/**
 * @module themes
 * @description Registry of all available application themes.
 */

import type { ThemeDefinition } from "./types";
import { defaultTheme } from "./themes/default";
import { githubTheme } from "./themes/github";
import { discordTheme } from "./themes/discord";
import { spotifyTheme } from "./themes/spotify";
import { slackTheme } from "./themes/slack";
import { linearTheme } from "./themes/linear";
import { notionTheme } from "./themes/notion";
import { twitterTheme } from "./themes/twitter";
import { airbnbTheme } from "./themes/airbnb";
import { youtubeTheme } from "./themes/youtube";
import { zincTheme } from "./themes/zinc";
import { figmaTheme } from "./themes/figma";
import { outlookTheme } from "./themes/outlook";
import { acmeTheme } from "./themes/acme";
import { vercelTheme } from "./themes/vercel";
import { midnightTheme } from "./themes/midnight";
import { rosepineTheme } from "./themes/rosepine";
import { nordTheme } from "./themes/nord";
import { emeraldTheme } from "./themes/emerald";
import { amberTheme } from "./themes/amber";
import { cyberpunkTheme } from "./themes/cyberpunk";
import { slateTheme } from "./themes/slate";
import { rubyTheme } from "./themes/ruby";
import { violetTheme } from "./themes/violet";
import { auraTheme } from "./themes/aura";
import { evergreenTheme } from "./themes/evergreen";
import { vanguardTheme } from "./themes/vanguard";
import { serenityTheme } from "./themes/serenity";
import { ignitionTheme } from "./themes/ignition";
import { glacierTheme } from "./themes/glacier";
import { saharaTheme } from "./themes/sahara";
import { voidTheme } from "./themes/void";
import { botanistTheme } from "./themes/botanist";
import { nebulaTheme } from "./themes/nebula";
import { neobrutalismTheme } from "./themes/neobrutalism";

export const themes: Record<string, ThemeDefinition> = {
  default: defaultTheme,
  github: githubTheme,
  discord: discordTheme,
  spotify: spotifyTheme,
  slack: slackTheme,
  linear: linearTheme,
  notion: notionTheme,
  twitter: twitterTheme,
  airbnb: airbnbTheme,
  youtube: youtubeTheme,
  zinc: zincTheme,
  figma: figmaTheme,
  outlook: outlookTheme,
  acme: acmeTheme,
  vercel: vercelTheme,
  midnight: midnightTheme,
  rosepine: rosepineTheme,
  nord: nordTheme,
  emerald: emeraldTheme,
  amber: amberTheme,
  cyberpunk: cyberpunkTheme,
  slate: slateTheme,
  ruby: rubyTheme,
  violet: violetTheme,
  aura: auraTheme,
  evergreen: evergreenTheme,
  vanguard: vanguardTheme,
  serenity: serenityTheme,
  ignition: ignitionTheme,
  glacier: glacierTheme,
  sahara: saharaTheme,
  void: voidTheme,
  botanist: botanistTheme,
  nebula: nebulaTheme,
  neobrutalism: neobrutalismTheme,
};

/**
 * Ordered list of available theme names.
 */
export const themeNames = Object.keys(themes);
