import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Resend } from 'resend';
import packageJson from '../package.json' with { type: 'json' };
import { DashboardClient } from './lib/dashboard-client.js';
import { ResendEditorClient } from './lib/resend-editor-client.js';
import { TOOL_CATEGORIES } from './tools/categories.js';
import {
  addApiKeyTools,
  addAutomationTools,
  addBroadcastTools,
  addContactPropertyTools,
  addContactTools,
  addDomainTools,
  addEditorTools,
  addEmailTools,
  addEventTools,
  addLogTools,
  addSegmentTools,
  addTemplateTools,
  addTopicTools,
  addWebhookTools,
} from './tools/index.js';
import type { ServerOptions } from './types.js';

export type { ServerOptions } from './types.js';

export function createMcpServer(
  resend: Resend,
  options: ServerOptions,
  apiKey: string,
): McpServer {
  const { senderEmailAddress, replierEmailAddresses = [], tools } = options;
  // No `tools` option means expose every category (backward compatible).
  const enabled = new Set(tools ?? TOOL_CATEGORIES);

  const server = new McpServer({
    name: 'resend',
    version: packageJson.version,
  });

  const dashboard = new DashboardClient();
  const apiClient = new ResendEditorClient(apiKey);

  // Always build the editor session helper — broadcast/template compose tools
  // depend on it — but only register the editor tools when Editor is enabled.
  const { withEditorSession } = addEditorTools(server, dashboard, apiClient, {
    registerTools: enabled.has('Editor'),
  });

  if (enabled.has('ApiKey')) addApiKeyTools(server, resend);
  if (enabled.has('Automation')) addAutomationTools(server, resend);
  if (enabled.has('Broadcast'))
    addBroadcastTools(server, resend, apiClient, {
      senderEmailAddress,
      replierEmailAddresses,
      withEditorSession,
    });
  if (enabled.has('Contact')) {
    addContactPropertyTools(server, resend);
    addContactTools(server, resend);
  }
  if (enabled.has('Domain')) addDomainTools(server, resend);
  if (enabled.has('Email'))
    addEmailTools(server, resend, {
      senderEmailAddress,
      replierEmailAddresses,
    });
  if (enabled.has('Event')) addEventTools(server, resend);
  if (enabled.has('Log')) addLogTools(server, resend);
  if (enabled.has('Segment')) addSegmentTools(server, resend);
  if (enabled.has('Template'))
    addTemplateTools(server, resend, apiClient, { withEditorSession });
  if (enabled.has('Topic')) addTopicTools(server, resend);
  if (enabled.has('Webhook')) addWebhookTools(server, resend);
  return server;
}
