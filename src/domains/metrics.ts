import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult } from '../utils/types.js';
import { domotzRequest } from '../utils/client.js';
import { logger } from '../utils/logger.js';

function getTools(): Tool[] {
  return [
    {
      name: 'domotz_metrics_variables_list',
      description: 'List all monitored SNMP metrics and variables for a device.',
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
      name: 'domotz_metrics_variable_history',
      description: 'Get historical values for a specific SNMP metric/variable as a time series.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The device ID' },
          variable_id: { type: 'number', description: 'The variable/metric ID' },
        },
        required: ['agent_id', 'device_id', 'variable_id'],
      },
    },
    {
      name: 'domotz_metrics_snmp_sensors_list',
      description: 'List all custom SNMP sensors configured on a device.',
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
      name: 'domotz_metrics_sensor_history',
      description: 'Get historical data for a custom SNMP sensor.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agent_id: { type: 'number', description: 'The agent/collector ID' },
          device_id: { type: 'number', description: 'The device ID' },
          sensor_id: { type: 'number', description: 'The SNMP sensor ID' },
        },
        required: ['agent_id', 'device_id', 'sensor_id'],
      },
    },
  ];
}

async function handleCall(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const agentId = args.agent_id as number;
  const deviceId = args.device_id as number;

  switch (toolName) {
    case 'domotz_metrics_variables_list': {
      logger.info('Listing device variables', { agentId, deviceId });
      const vars = await domotzRequest(`/agent/${agentId}/device/${deviceId}/variable`);
      return { content: [{ type: 'text', text: JSON.stringify(vars, null, 2) }] };
    }
    case 'domotz_metrics_variable_history': {
      const variableId = args.variable_id as number;
      logger.info('Getting variable history', { agentId, deviceId, variableId });
      const history = await domotzRequest(`/agent/${agentId}/device/${deviceId}/variable/${variableId}/history`);
      return { content: [{ type: 'text', text: JSON.stringify(history, null, 2) }] };
    }
    case 'domotz_metrics_snmp_sensors_list': {
      logger.info('Listing SNMP sensors', { agentId, deviceId });
      const sensors = await domotzRequest(`/agent/${agentId}/device/${deviceId}/eye/snmp`);
      return { content: [{ type: 'text', text: JSON.stringify(sensors, null, 2) }] };
    }
    case 'domotz_metrics_sensor_history': {
      const sensorId = args.sensor_id as number;
      logger.info('Getting sensor history', { agentId, deviceId, sensorId });
      const history = await domotzRequest(`/agent/${agentId}/device/${deviceId}/eye/snmp/${sensorId}/history`);
      return { content: [{ type: 'text', text: JSON.stringify(history, null, 2) }] };
    }
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

export const metricsHandler: DomainHandler = { getTools, handleCall };
