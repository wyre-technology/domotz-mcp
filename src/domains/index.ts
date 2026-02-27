import type { DomainHandler, DomainName } from '../utils/types.js';

const domainCache = new Map<DomainName, DomainHandler>();

export async function getDomainHandler(domain: DomainName): Promise<DomainHandler> {
  const cached = domainCache.get(domain);
  if (cached) return cached;

  let handler: DomainHandler;
  switch (domain) {
    case 'agents': {
      const { agentsHandler } = await import('./agents.js');
      handler = agentsHandler;
      break;
    }
    case 'devices': {
      const { devicesHandler } = await import('./devices.js');
      handler = devicesHandler;
      break;
    }
    case 'metrics': {
      const { metricsHandler } = await import('./metrics.js');
      handler = metricsHandler;
      break;
    }
    case 'network': {
      const { networkHandler } = await import('./network.js');
      handler = networkHandler;
      break;
    }
    case 'alerts': {
      const { alertsHandler } = await import('./alerts.js');
      handler = alertsHandler;
      break;
    }
    case 'power': {
      const { powerHandler } = await import('./power.js');
      handler = powerHandler;
      break;
    }
    default:
      throw new Error(`Unknown domain: ${domain}`);
  }

  domainCache.set(domain, handler);
  return handler;
}
