import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Resend } from 'resend';
import { describe, expect, it } from 'vitest';
import { createMcpServer } from '../src/server.js';

/** Read the names of tools registered on an McpServer via its internal map. */
function toolNames(server: McpServer): string[] {
  const registry = (server as unknown as { _registeredTools: object })
    ._registeredTools;
  return Object.keys(registry);
}

describe('createMcpServer', () => {
  it('returns an MCP server with connect method', () => {
    const resend = {} as Resend;
    const server = createMcpServer(resend, {
      senderEmailAddress: 'from@test.dev',
      replierEmailAddresses: ['reply@test.dev'],
    });
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });

  it('accepts empty sender and repliers', () => {
    const resend = {} as Resend;
    const server = createMcpServer(resend, {
      replierEmailAddresses: [],
    });
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });

  it('registers all 80 tools when tools is not specified', () => {
    const server = createMcpServer({} as Resend, { replierEmailAddresses: [] });
    expect(toolNames(server)).toHaveLength(80);
  });

  it('registers only the selected category', () => {
    const server = createMcpServer({} as Resend, {
      replierEmailAddresses: [],
      tools: ['Email'],
    });
    const names = toolNames(server);
    expect(names).toContain('send-email');
    expect(names).not.toContain('create-api-key');
    expect(names).toHaveLength(12);
  });

  it('Contact category includes both contact and contact-property tools', () => {
    const server = createMcpServer({} as Resend, {
      replierEmailAddresses: [],
      tools: ['Contact'],
    });
    const names = toolNames(server);
    expect(names).toContain('create-contact');
    expect(names).toContain('create-contact-property');
    expect(names).toHaveLength(15);
  });

  it('does not register editor tools unless Editor is enabled', () => {
    const server = createMcpServer({} as Resend, {
      replierEmailAddresses: [],
      tools: ['Email'],
    });
    expect(toolNames(server)).not.toContain('get-tiptap-json-content');
  });

  // Broadcast tools depend on the editor session helper, which must still be
  // wired even when the Editor category (and its tools) are disabled.
  it('registers broadcast tools without editor tools', () => {
    const server = createMcpServer({} as Resend, {
      replierEmailAddresses: [],
      tools: ['Broadcast'],
    });
    const names = toolNames(server);
    expect(names).toContain('create-broadcast');
    expect(names).not.toContain('get-tiptap-json-content');
  });
});
