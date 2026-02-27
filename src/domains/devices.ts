import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult } from '../utils/types.js';
import { domotzRequest } from '../utils/client.js';
import { logger } from '../utils/logger.js';

function getTools(): Tool[] {
  return [
    {
      name: 'domotz_devices_list',
      description: 'List all devices on a specific agent\'s network with their online/offline status, IP addresses, MAC address, and device type.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'domotz_devices_get',
      description: 'Get full details for a specific device including vendor, model, OS, and services.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The device ID' },
        },
        required: ['agent_id', 'device_id'],
      },
    },
    {
      name: 'domotz_devices_uptime',
      description: 'Get uptime history and current uptime for a device.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The device ID' },
        },
        required: ['agent_id', 'device_id'],
      },
    },
    {
      name: 'domotz_devices_history',
      description: 'Get the online/offline event history for a device.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The device ID' },
        },
        required: ['agent_id', 'device_id'],
      },
    },
    {
      name: 'domotz_devices_inventory',
      description: 'Get inventory metadata for a device (owner, location, notes, and other custom fields).',
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
  const agentId = args.agent_id as number;
  const deviceId = args.device_id as number;

  switch (toolName) {
    case 'domotz_devices_list': {
      logger.info('Listing devices', { agentId });
      const devices = await domotzRequest(`/agent/${agentId}/device`);
      return { content: [{ type: 'text', text: JSON.stringify(devices, null, 2) }] };
    }
    case 'domotz_devices_get': {
      logger.info('Getting device', { agentId, deviceId });
      const device = await domotzRequest(`/agent/${agentId}/device/${deviceId}`);
      return { content: [{ type: 'text', text: JSON.stringify(device, null, 2) }] };
    }
    case 'domotz_devices_uptime': {
      logger.info('Getting device uptime', { agentId, deviceId });
      const uptime = await domotzRequest(`/agent/${agentId}/device/${deviceId}/uptime`);
      return { content: [{ type: 'text', text: JSON.stringify(uptime, null, 2) }] };
    }
    case 'domotz_devices_history': {
      logger.info('Getting device history', { agentId, deviceId });
      const history = await domotzRequest(`/agent/${agentId}/device/${deviceId}/history/rtd`);
      return { content: [{ type: 'text', text: JSON.stringify(history, null, 2) }] };
    }
    case 'domotz_devices_inventory': {
      logger.info('Getting device inventory', { agentId, deviceId });
      const inventory = await domotzRequest(`/agent/${agentId}/device/${deviceId}/inventory`);
      return { content: [{ type: 'text', text: JSON.stringify(inventory, null, 2) }] };
    }
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

export const devicesHandler: DomainHandler = { getTools, handleCall };
