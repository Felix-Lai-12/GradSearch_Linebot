import express, { Request, Response } from 'express';
import { Client, WebhookRequestBody, validateSignature } from '@line/bot-sdk';
import { config } from './config';
import { handleEvent } from './webhook/handler';

const app = express();

// LINE SDK config
const lineConfig = {
    channelAccessToken: config.line.channelAccessToken,
    channelSecret: config.line.channelSecret,
};

const client = new Client(lineConfig);

// ============================================================
// Routes
// ============================================================

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'gradsearch-linebot',
    });
});

// LINE Webhook — manual signature validation for better error handling
app.post('/webhook', express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }), async (req: Request, res: Response) => {
    const signature = req.headers['x-line-signature'] as string;

    // If no signature, return 200 for LINE webhook URL verification
    if (!signature) {
        console.log('No signature — possible webhook URL verification');
        res.status(200).json({ message: 'OK' });
        return;
    }

    // Validate signature
    const rawBody = (req as any).rawBody;
    if (!validateSignature(rawBody, config.line.channelSecret, signature)) {
        console.warn('Invalid signature');
        res.status(403).json({ error: 'Invalid signature' });
        return;
    }

    const body = req.body as WebhookRequestBody;

    // Empty events array (LINE sends this for verification)
    if (!body.events || body.events.length === 0) {
        console.log('Empty events — webhook verification success');
        res.status(200).json({ success: true });
        return;
    }

    try {
        const results = await Promise.all(
            body.events.map(event => handleEvent(client, event))
        );
        console.log(`Processed ${results.length} event(s)`);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// Start server (local dev)
// ============================================================
if (process.env.NODE_ENV !== 'production') {
    app.listen(config.port, () => {
        console.log(`🚀 GradSearch Bot running on port ${config.port}`);
        console.log(`   Health: http://localhost:${config.port}/health`);
        console.log(`   Webhook: http://localhost:${config.port}/webhook`);
    });
}

// Export for Cloud Functions
export const handleRequest = app;
