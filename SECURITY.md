# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in GradSearch, please report it by:

1. **Email**: [Your contact email]
2. **GitHub Security Advisory**: Use the "Security" tab in this repository

Please do NOT create a public GitHub issue for security vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Measures

### Data Protection
- All sensitive credentials are stored as environment variables
- User IDs are masked in logs and public issues
- No PII (Personally Identifiable Information) is stored beyond LINE User IDs

### API Security
- LINE webhook signature verification enabled
- Rate limiting through quota system (10 requests/day for free tier)
- All external API calls use HTTPS

### Database Security
- Supabase Row Level Security (RLS) policies enabled
- Service key used only in backend, never exposed to client
- Parameterized queries to prevent SQL injection

## Privacy Policy

### Data Collection
We collect:
- LINE User ID (for service functionality)
- Search queries and chat history (for AI recommendations)
- Usage statistics (anonymous)

### Data Usage
- User data is used solely for providing the service
- No data is sold to third parties
- Chat history is stored for context but can be deleted on request

### Data Retention
- Chat history: 30 days
- Search logs: 90 days
- User accounts: Until user blocks the bot

## Third-Party Services

This project uses:
- **LINE Messaging API**: User communication
- **Google Gemini API**: AI recommendations
- **Supabase**: Database and authentication
- **Google Cloud Functions**: Hosting
- **GitHub Issues**: Public feedback (user IDs are masked)

Each service has its own privacy policy and security measures.

## Updates

This security policy may be updated periodically. Check the commit history for changes.

Last updated: 2026-02-28
