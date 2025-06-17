# AI Financial Assistant - Claude Instructions

## Project Summary
Advanced AI financial assistant with dual database synchronization (MariaDB + Firefly III). Processes natural language commands for expense tracking, receipt analysis, calendar management, and document generation while maintaining data consistency across multiple systems.

## Architecture
- **Main App**: Node.js/Express AI assistant in `firefly-iii/` submodule
- **Primary DB**: MariaDB `192.168.1.100:3306` (finance database)  
- **Firefly III**: Docker container `localhost:3001` for professional financial management
- **Dual Sync**: Automatic synchronization between both databases
- **AI Processing**: OpenAI function calling for natural language understanding

## Key Features
- Natural language transaction recording with receipt OCR
- Dual database sync maintaining consistency across systems
- Multi-currency support (EUR, CHF, USD)
- Telegram bot integration for receipt processing
- Google Calendar/Docs/Drive integration
- Professional financial reporting via Firefly III

## Critical Files
- `firefly-iii/src/firefly.js` - Dual sync implementation with `createSyncedTransaction()`
- `firefly-iii/src/server.js` - AI dispatch enhanced for dual database operations
- `docker-compose.yml` - Firefly III Docker setup
- `.env` - Database credentials and API tokens

## Development Guidelines
- Always test dual sync with `node test_sync.js`
- Use synced functions for all financial operations
- Maintain minimal AI interface - users shouldn't notice complexity
- Verify data appears in both MariaDB and Firefly III after changes
- Keep natural language commands simple and conversational

## Current Status
✅ 81 transactions + 187 items + 1 income successfully migrated
✅ Dual database sync fully operational
✅ AI interface unchanged for users
✅ Docker Firefly III running on localhost:3001
✅ All systems integrated and tested