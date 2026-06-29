import type { ARIAPlugin } from '../Plugin'
import type { PluginContext } from '../PluginContext'
import type { PluginHealth, PluginToolDefinition, PluginToolResult } from '../PluginTypes'
import type { PluginManifest } from '../PluginManifest'

const MANIFEST: PluginManifest = {
  id: 'aria-weather',
  name: 'Weather',
  version: '1.0.0',
  author: 'ARIA Core',
  description: 'Get current weather and forecasts to help plan your day.',
  capabilities: ['chat', 'network'],
  permissions: ['network'],
  minimumARIAVersion: '1.0.0',
}

const MOCK_CONDITIONS = ['Sunny', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Thunderstorm', 'Clear']

function mockWeather(city: string) {
  const seed = city.length % MOCK_CONDITIONS.length
  return {
    city,
    condition: MOCK_CONDITIONS[seed],
    temperatureC: 18 + seed * 3,
    humidity: 50 + seed * 5,
    windKph: 10 + seed * 2,
    feelsLikeC: 16 + seed * 3,
    forecast: ['Tomorrow: Similar conditions', 'Day after: Improving'],
  }
}

export class WeatherPlugin implements ARIAPlugin {
  readonly manifest = MANIFEST
  private ctx: PluginContext | null = null

  async install(ctx: PluginContext): Promise<void> {
    ctx.logger.info('WeatherPlugin installed')
  }

  async initialize(ctx: PluginContext): Promise<void> {
    this.ctx = ctx
    ctx.logger.info('WeatherPlugin initialized')
  }

  async enable(): Promise<void> {
    this.ctx?.logger.info('WeatherPlugin enabled')
  }

  async disable(): Promise<void> {
    this.ctx?.logger.info('WeatherPlugin disabled')
  }

  async upgrade(previousVersion: string, ctx: PluginContext): Promise<void> {
    ctx.logger.info(`WeatherPlugin upgraded from ${previousVersion}`)
  }

  async shutdown(): Promise<void> {
    this.ctx?.logger.info('WeatherPlugin shut down')
    this.ctx = null
  }

  async healthCheck(): Promise<PluginHealth> {
    return {
      healthy: true,
      status: 'enabled',
      lastCheckedAt: new Date().toISOString(),
      responseTimeMs: 0,
    }
  }

  getToolDefinitions(): PluginToolDefinition[] {
    return [
      {
        name: 'get_weather',
        description: 'Get the current weather for a city to help the user plan their day.',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name (e.g., "Mumbai", "London")' },
          },
          required: ['city'],
        },
      },
      {
        name: 'get_weather_forecast',
        description: 'Get a short weather forecast for a city.',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
            days: { type: 'number', description: 'Number of forecast days (1-3)', default: 2 },
          },
          required: ['city'],
        },
      },
    ]
  }

  async executeTool(toolName: string, args: Record<string, unknown>, ctx: PluginContext): Promise<PluginToolResult> {
    switch (toolName) {
      case 'get_weather':
        return this.getWeather(args as { city: string }, ctx)
      case 'get_weather_forecast':
        return this.getForecast(args as { city: string; days?: number }, ctx)
      default:
        return { success: false, message: `Unknown tool: ${toolName}`, error: 'unknown_tool' }
    }
  }

  private async getWeather(args: { city: string }, ctx: PluginContext): Promise<PluginToolResult> {
    ctx.logger.info(`Getting weather for ${args.city}`)
    const weather = mockWeather(args.city)
    return {
      success: true,
      message: `Weather for ${args.city} retrieved.`,
      data: {
        ...weather,
        summary: `${weather.city}: ${weather.condition}, ${weather.temperatureC}°C (feels like ${weather.feelsLikeC}°C), humidity ${weather.humidity}%, wind ${weather.windKph} km/h`,
      },
    }
  }

  private async getForecast(args: { city: string; days?: number }, ctx: PluginContext): Promise<PluginToolResult> {
    ctx.logger.info(`Getting forecast for ${args.city}`)
    const weather = mockWeather(args.city)
    const days = Math.min(args.days ?? 2, 3)
    return {
      success: true,
      message: `Forecast for ${args.city} retrieved.`,
      data: {
        city: args.city,
        current: `${weather.condition}, ${weather.temperatureC}°C`,
        forecast: weather.forecast.slice(0, days),
      },
    }
  }
}
