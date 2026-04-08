import { ToolDef } from '../providers/interface.js';
import { CanonicalCapability } from '../../capabilities/types.js';
import { capabilitiesToRegistry } from '../../capabilities/adapter.js';
import { filterCapabilities } from '../../capabilities/filter.js';
import { workflowsToCapabilities } from '../../capabilities/workflows.js';
import {
  connectorTools,
  consolidatedTools,
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
  const aiTools = filterCapabilities(getAllCapabilities(), { surface: 'aiTool' });
  return capabilitiesToRegistry(aiTools);
}

export function getAllCapabilities(): CanonicalCapability[] {
  // Collect non-workflow capabilities first so workflows can reference their types
  const nonWorkflow: CanonicalCapability[] = [
    ...connectorTools,
    ...consolidatedTools,
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
  return [
    ...nonWorkflow,
    ...workflowsToCapabilities(nonWorkflow),
  ];
}
