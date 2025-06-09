# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun run dev` - Start development server with hot reload
- `bun install` - Install dependencies

### Code Quality
- `bun run lint` - Run Biome linter with auto-fix
- `bun run format` - Format code with Biome
- `bun run biome:check:write` - Run Biome check with auto-fix (used in pre-commit hook)

### Testing
- `bun test` - Run tests (uses Bun's built-in test runner)

### CLI Tools
- `bun run fact-check "text to check"` - Run fact-check on a given text
- `bun run upload` - Upload documents from policy/ to vector store

## Architecture

This is a Twitter/X fact-checking system that monitors tweets and uses AI to verify claims against a knowledge base.

### Core Components

**Hono Web Server** (`src/index.ts`)
- Main application entry point with REST endpoints
- `/cron/fetch` - Scheduled endpoint for Twitter monitoring
- `/slack/events` and `/slack/actions` - Slack integration endpoints
- `/test/slack` - Test endpoint for Slack notifications

**Fact Checking Engine** (`src/lib/fact-check.ts`)
- Uses OpenAI o3-mini model with vector store for document search
- Implements strict fact-checking criteria with filtering rules
- Returns structured results with citations from knowledge base

**Twitter Integration** (`src/lib/twitter.ts`)
- Supports both OAuth 1.0a (read/write) and OAuth 2 Bearer (read-only)
- Automatically selects authentication method based on available env vars

**Slack Integration** (`src/lib/slack/`)
- Real-time notifications for problematic tweets
- Interactive Slack app with actions and events

**Query Builder** (`src/lib/twitter_query/`)
- Configurable search query construction for Twitter API
- Supports multiple keywords with OR logic and filters

### Environment Variables

Essential variables (see README.md for complete list):
- `OPENAI_API_KEY` - OpenAI API access
- `VECTOR_STORE_ID` - OpenAI vector store for knowledge base
- `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CHANNEL_ID` - Slack integration
- `X_APP_KEY`, `X_APP_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` - Twitter OAuth 1.0a
- `X_BEARER_TOKEN` - Twitter OAuth 2 (alternative to OAuth 1.0a)
- `CRON_SECRET` - Authentication for cron endpoints

### Data Flow

1. **Setup**: Documents in `policy/` are uploaded to OpenAI vector store
2. **Monitoring**: Cron job calls `/cron/fetch` to search recent tweets
3. **Analysis**: Each tweet is fact-checked against vector store knowledge base
4. **Notification**: Problematic tweets trigger Slack alerts with citations

### Code Standards

- Uses Biome for linting and formatting (2-space indentation, double quotes)
- Pre-commit hook runs `bun run biome:check:write` with auto-staging
- TypeScript with strict configuration