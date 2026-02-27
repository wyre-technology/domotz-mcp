import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult } from '../utils/types.js';
import { domotzRequest } from '../utils/client.js';
import { logger } from '../utils/logger.js';

function getTools(): Tool[] {
  return [
    {
      name: 'domotz_agents_list',
      description: 'List all Domotz collectors (agents) with status, IP address, and location.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'domotz_agents_get',
      description: 'Get detailed information about a specific Domotz collector/agent.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
        },
        required: ['agent_id'],
      },
    },
  ];
}

async function handleCall(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
  switch (toolName) {
    case 'domotz_agents_list': {
      logger.info('Listing agents');
      const agents = await domotzRequest('/agent');
      return { content: [{ type: 'text', text: JSON.stringify(agents, null, 2) }] };
    }
    case 'domotz_agents_get': {
      const agentId = args.agent_id as number;
      logger.info('Getting agent', { agentId });
      const agent = await domotzRequest(`/agent/${agentId}`);
      return { content: [{ type: 'text', text: JSON.stringify(agent, null, 2) }] };
    }
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

export const agentsHandler: DomainHandler = { getTools, handleCall };
