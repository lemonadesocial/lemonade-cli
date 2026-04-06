import { ToolDef } from '../providers/interface.js';
import {
  connectorTools,
  eventTools,
  fileTools,
  launchpadTools,
  newsletterTools,
  notificationsTools,
  pageTools,
  paymentTools,
  rewardsTools,
  sessionTools,
  spaceTools,
  subscriptionTools,
  systemTools,
  templateTools,
  tempoTools,
  themeTools,
  ticketsTools,
  userTools,
  votingTools,
} from './domains/index.js';

export function buildToolRegistry(): Record<string, ToolDef> {
  const allTools: ToolDef[] = [
    ...connectorTools,
    ...eventTools,
    ...fileTools,
    ...launchpadTools,
    ...newsletterTools,
    ...notificationsTools,
    ...pageTools,
    ...paymentTools,
    ...rewardsTools,
    ...sessionTools,
    ...spaceTools,
    ...subscriptionTools,
    ...systemTools,
    ...templateTools,
    ...tempoTools,
    ...themeTools,
    ...ticketsTools,
    ...userTools,
    ...votingTools,
  ];

  const registry: Record<string, ToolDef> = {};
  for (const tool of allTools) {
    registry[tool.name] = tool;
  }
  return registry;
}
