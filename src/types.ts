import type { ToolCategory } from './tools/categories.js';

export interface ServerOptions {
  senderEmailAddress?: string;
  replierEmailAddresses?: string[];
  /**
   * Tool categories to register. When omitted, all categories are enabled.
   * Filtering shrinks the tool payload sent to the LLM.
   */
  tools?: ToolCategory[];
}
