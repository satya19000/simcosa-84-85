"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherPlugin = void 0;
const MANIFEST = {
    id: 'aria-weather',
    name: 'Weather',
    version: '1.0.0',
    author: 'ARIA Core',
    description: 'Get current weather and forecasts to help plan your day.',
    capabilities: ['chat', 'network'],
    permissions: ['network'],
    minimumARIAVersion: '1.0.0',
};
const MOCK_CONDITIONS = ['Sunny', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Thunderstorm', 'Clear'];
function mockWeather(city) {
    const seed = city.length % MOCK_CONDITIONS.length;
    return {
        city,
        condition: MOCK_CONDITIONS[seed],
        temperatureC: 18 + seed * 3,
        humidity: 50 + seed * 5,
        windKph: 10 + seed * 2,
        feelsLikeC: 16 + seed * 3,
        forecast: ['Tomorrow: Similar conditions', 'Day after: Improving'],
    };
}
class WeatherPlugin {
    constructor() {
        this.manifest = MANIFEST;
        this.ctx = null;
    }
    async install(ctx) {
        ctx.logger.info('WeatherPlugin installed');
    }
    async initialize(ctx) {
        this.ctx = ctx;
        ctx.logger.info('WeatherPlugin initialized');
    }
    async enable() {
        this.ctx?.logger.info('WeatherPlugin enabled');
    }
    async disable() {
        this.ctx?.logger.info('WeatherPlugin disabled');
    }
    async upgrade(previousVersion, ctx) {
        ctx.logger.info(`WeatherPlugin upgraded from ${previousVersion}`);
    }
    async shutdown() {
        this.ctx?.logger.info('WeatherPlugin shut down');
        this.ctx = null;
    }
    async healthCheck() {
        return {
            healthy: true,
            status: 'enabled',
            lastCheckedAt: new Date().toISOString(),
            responseTimeMs: 0,
        };
    }
    getToolDefinitions() {
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
        ];
    }
    async executeTool(toolName, args, ctx) {
        switch (toolName) {
            case 'get_weather':
                return this.getWeather(args, ctx);
            case 'get_weather_forecast':
                return this.getForecast(args, ctx);
            default:
                return { success: false, message: `Unknown tool: ${toolName}`, error: 'unknown_tool' };
        }
    }
    async getWeather(args, ctx) {
        ctx.logger.info(`Getting weather for ${args.city}`);
        const weather = mockWeather(args.city);
        return {
            success: true,
            message: `Weather for ${args.city} retrieved.`,
            data: {
                ...weather,
                summary: `${weather.city}: ${weather.condition}, ${weather.temperatureC}°C (feels like ${weather.feelsLikeC}°C), humidity ${weather.humidity}%, wind ${weather.windKph} km/h`,
            },
        };
    }
    async getForecast(args, ctx) {
        ctx.logger.info(`Getting forecast for ${args.city}`);
        const weather = mockWeather(args.city);
        const days = Math.min(args.days ?? 2, 3);
        return {
            success: true,
            message: `Forecast for ${args.city} retrieved.`,
            data: {
                city: args.city,
                current: `${weather.condition}, ${weather.temperatureC}°C`,
                forecast: weather.forecast.slice(0, days),
            },
        };
    }
}
exports.WeatherPlugin = WeatherPlugin;
//# sourceMappingURL=WeatherPlugin.js.map