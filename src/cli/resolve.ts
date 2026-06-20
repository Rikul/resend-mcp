import type { ParsedArgs } from 'minimist';
import { TOOL_CATEGORIES, type ToolCategory } from '../tools/categories.js';
import { DEFAULT_HTTP_PORT } from './constants.js';
import { parseAllowedHosts, parseReplierAddresses } from './parse.js';
import type { ResolveResult } from './types.js';

function resolveHost(
  parsed: ParsedArgs,
  env: NodeJS.ProcessEnv,
): string | undefined {
  if (typeof parsed.host === 'string' && parsed.host.trim() !== '')
    return parsed.host.trim();
  if (typeof env.MCP_HOST === 'string' && env.MCP_HOST.trim() !== '')
    return env.MCP_HOST.trim();
  return undefined;
}

function parsePort(parsed: ParsedArgs, env: NodeJS.ProcessEnv): number {
  const fromArg =
    typeof parsed.port === 'string' && parsed.port.trim() !== ''
      ? Number.parseInt(parsed.port.trim(), 10)
      : NaN;
  if (Number.isInteger(fromArg) && fromArg > 0 && fromArg < 65536)
    return fromArg;
  const fromEnv =
    typeof env.MCP_PORT === 'string' && env.MCP_PORT.trim() !== ''
      ? Number.parseInt(env.MCP_PORT.trim(), 10)
      : NaN;
  if (Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv < 65536)
    return fromEnv;
  return DEFAULT_HTTP_PORT;
}

type ToolsResult =
  | { ok: true; tools: ToolCategory[] }
  | { ok: false; error: string };

/**
 * Resolve enabled tool categories from `--tools`. No env support by design.
 * Absent flag enables all categories. Names match case-insensitively and are
 * normalized to canonical form; unknown names (or an empty value) are errors.
 */
function parseToolCategories(parsed: ParsedArgs): ToolsResult {
  const raw = parsed.tools;
  if (raw === undefined) return { ok: true, tools: [...TOOL_CATEGORIES] };

  const values = (Array.isArray(raw) ? raw : [raw])
    .flatMap((v) => String(v).split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  if (values.length === 0) {
    return {
      ok: false,
      error: `--tools was provided but empty. Valid categories: ${TOOL_CATEGORIES.join(', ')}`,
    };
  }

  const canonicalByLower = new Map<string, ToolCategory>(
    TOOL_CATEGORIES.map((c) => [c.toLowerCase(), c]),
  );
  const selected = new Set<ToolCategory>();
  const invalid: string[] = [];
  for (const value of values) {
    const canonical = canonicalByLower.get(value.toLowerCase());
    if (canonical) selected.add(canonical);
    else invalid.push(value);
  }

  if (invalid.length > 0) {
    return {
      ok: false,
      error: `Invalid --tools value${invalid.length === 1 ? '' : 's'}: ${invalid.join(', ')}. Valid categories: ${TOOL_CATEGORIES.join(', ')}`,
    };
  }

  return { ok: true, tools: [...selected] };
}

/**
 * Resolve config from parsed argv and env. No side effects, no exit.
 */
export function resolveConfig(
  parsed: ParsedArgs,
  env: NodeJS.ProcessEnv = process.env,
): ResolveResult {
  const apiKey =
    (typeof parsed.key === 'string' ? parsed.key : null) ??
    env.RESEND_API_KEY ??
    null;

  const http = parsed.http === true;

  // Stdio requires an API key at startup. HTTP mode is lenient because
  // each client provides their own key via the Authorization: Bearer header.
  if (!http && (!apiKey || !apiKey.trim())) {
    return {
      ok: false,
      error:
        'No API key. Set RESEND_API_KEY or use --key=<your-resend-api-key>',
    };
  }

  const tools = parseToolCategories(parsed);
  if (!tools.ok) {
    return { ok: false, error: tools.error };
  }

  const senderEmailAddress =
    (typeof parsed.sender === 'string' ? parsed.sender : null) ??
    (typeof env.SENDER_EMAIL_ADDRESS === 'string'
      ? env.SENDER_EMAIL_ADDRESS.trim() || undefined
      : undefined);

  const port = parsePort(parsed, env);

  const base = {
    senderEmailAddress: senderEmailAddress ?? '',
    replierEmailAddresses: parseReplierAddresses(parsed, env),
    port,
    tools: tools.tools,
  };

  return {
    ok: true,
    config: http
      ? {
          ...base,
          transport: 'http' as const,
          apiKey: apiKey?.trim(),
          host: resolveHost(parsed, env),
          allowedHosts: parseAllowedHosts(parsed, env),
        }
      : { ...base, transport: 'stdio' as const, apiKey: apiKey!.trim() },
  };
}
