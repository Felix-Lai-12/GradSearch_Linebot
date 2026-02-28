import dotenv from 'dotenv';

dotenv.config();

interface Config {
    line: {
        channelAccessToken: string;
        channelSecret: string;
    };
    supabase: {
        url: string;
        serviceKey: string;
    };
    firecrawl: {
        apiKey: string;
    };
    port: number;
}

function getEnvOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const config: Config = {
    line: {
        channelAccessToken: getEnvOrThrow('LINE_CHANNEL_ACCESS_TOKEN'),
        channelSecret: getEnvOrThrow('LINE_CHANNEL_SECRET'),
    },
    supabase: {
        url: getEnvOrThrow('SUPABASE_URL'),
        serviceKey: getEnvOrThrow('SUPABASE_SERVICE_KEY'),
    },
    firecrawl: {
        apiKey: process.env.FIRECRAWL_API_KEY || '',
    },
    port: parseInt(process.env.PORT || '3000', 10),
};
