import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult } from '../utils/types.js';
import { domotzRequest } from '../utils/client.js';
import { logger } from '../utils/logger.js';

function getTools(): Tool[] {
  return [
    {
      name: 'domotz_alerts_profiles_list',
      description: 'List all configured alert profiles in the Domotz account.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'domotz_alerts_device_list',
      description: 'List alert profile bindings for a specific device.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The device ID' },
        },
        required: ['agent_id', 'device_id'],
      },
    },
  ];
}

async function handleCall(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
  switch (toolName) {
    case 'domotz_alerts_profiles_list': {
      logger.info('Listing alert profiles');
      const profiles = await domotzRequest('/alert-profile');
      return { content: [{ type: 'text', text: JSON.stringify(profiles, null, 2) }] };
    }
    case 'domotz_alerts_device_list': {
      const agentId = args.agent_id as number;
      const deviceId = args.device_id as number;
      logger.info('Listing device alerts', { agentId, deviceId });
      const bindings = await domotzRequest(`/agent/${agentId}/device/${deviceId}/alert-profile`);
      return { content: [{ type: 'text', text: JSON.stringify(bindings, null, 2) }] };
    }
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

export const alertsHandler: DomainHandler = { getTools, handleCall };
