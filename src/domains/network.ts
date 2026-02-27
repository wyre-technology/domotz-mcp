import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult } from '../utils/types.js';
import { domotzRequest } from '../utils/client.js';
import { logger } from '../utils/logger.js';

function getTools(): Tool[] {
  return [
    {
      name: 'domotz_network_topology',
      description: 'Get the network topology graph for an agent, showing how devices are connected.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'domotz_network_interfaces',
      description: 'List network interfaces configured on an agent.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'domotz_network_ip_conflicts',
      description: 'List detected IP address conflicts on an agent\'s network.',
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
  const agentId = args.agent_id as number;

  switch (toolName) {
    case 'domotz_network_topology': {
      logger.info('Getting network topology', { agentId });
      const topology = await domotzRequest(`/agent/${agentId}/network-topology`);
      return { content: [{ type: 'text', text: JSON.stringify(topology, null, 2) }] };
    }
    case 'domotz_network_interfaces': {
      logger.info('Getting network interfaces', { agentId });
      const interfaces = await domotzRequest(`/agent/${agentId}/network/interfaces`);
      return { content: [{ type: 'text', text: JSON.stringify(interfaces, null, 2) }] };
    }
    case 'domotz_network_ip_conflicts': {
      logger.info('Getting IP conflicts', { agentId });
      const conflicts = await domotzRequest(`/agent/${agentId}/ip-conflict`);
      return { content: [{ type: 'text', text: JSON.stringify(conflicts, null, 2) }] };
    }
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

export const networkHandler: DomainHandler = { getTools, handleCall };
