/**
 * Canonical list of tool categories exposed via the `--tools` CLI flag.
 *
 * Kept dependency-free so both the CLI parser and the server can import it
 * without pulling in the tool registration modules. Each category maps to one
 * or more `addXxxTools` calls in `server.ts`.
 */
export const TOOL_CATEGORIES = [
  'ApiKey',
  'Automation',
  'Broadcast',
  'Contact',
  'Domain',
  'Editor',
  'Email',
  'Event',
  'Log',
  'Segment',
  'Template',
  'Topic',
  'Webhook',
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
