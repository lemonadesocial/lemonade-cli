import { ToolDef } from '../providers/interface.js';
import { CanonicalCapability } from '../../capabilities/types.js';
import { capabilitiesToRegistry } from '../../capabilities/adapter.js';
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
  return capabilitiesToRegistry(getAllCapabilities());
}

export function getAllCapabilities(): CanonicalCapability[] {
  return [
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
}
