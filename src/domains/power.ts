import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult } from '../utils/types.js';
import { domotzRequest } from '../utils/client.js';
import { logger } from '../utils/logger.js';

function getTools(): Tool[] {
  return [
    {
      name: 'domotz_power_outlets_list',
      description: 'List PDU/smart outlet devices and their current power state.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The PDU/power device ID' },
        },
        required: ['agent_id', 'device_id'],
      },
    },
    {
      name: 'domotz_power_outlet_control',
      description: 'DESTRUCTIVE ACTION: Turn a specific power outlet on, off, or cycle (restart) it. This will affect connected equipment. Only proceed if explicitly confirmed.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The PDU/power device ID' },
          outlet_id: { type: 'number', description: 'The power outlet ID' },
          action: { type: 'string', enum: ['on', 'off', 'cycle'], description: 'Power action to perform' },
          confirm: { type: 'boolean', description: 'Must be true to confirm this destructive action' },
        },
        required: ['agent_id', 'device_id', 'outlet_id', 'action', 'confirm'],
      },
    },
  ];
}

async function handleCall(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
  switch (toolName) {
    case 'domotz_power_outlets_list': {
      const agentId = args.agent_id as number;
      const deviceId = args.device_id as number;
      logger.info('Listing power outlets', { agentId, deviceId });
      const outlets = await domotzRequest(`/agent/${agentId}/device/${deviceId}/power-outlet`);
      return { content: [{ type: 'text', text: JSON.stringify(outlets, null, 2) }] };
    }
    case 'domotz_power_outlet_control': {
      if (!args.confirm) {
        return {
          content: [{ type: 'text', text: 'Power control requires confirm: true. This action will affect connected equipment.' }],
          isError: true,
        };
      }
      const agentId = args.agent_id as number;
      const deviceId = args.device_id as number;
      const outletId = args.outlet_id as number;
      const action = args.action as string;
      logger.info('Controlling power outlet', { agentId, deviceId, outletId, action });
      await domotzRequest(`/agent/${agentId}/device/${deviceId}/power-outlet/${outletId}/action/${action}`, { method: 'POST' });
      return { content: [{ type: 'text', text: `Power outlet ${outletId} action '${action}' executed successfully.` }] };
    }
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

export const powerHandler: DomainHandler = { getTools, handleCall };
