# ClickUp Intake Router - Phase 1

Automated router for ClickUp intake tasks. Reads pending tasks from the Intake list (901327250067), applies keyword-based routing rules, and moves tasks to the correct work queues with custom fields and logging.

## Setup

### Prerequisites
- Node.js 18+
- ClickUp API key with task read/write permissions
- ClickUp Workspace with configured list IDs

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in required environment variables:
   - `CLICKUP_API_KEY`: Your ClickUp API key
   - `INTAKE_LIST_ID`: Source list ID (default: 901327250067)
   - Target queue list IDs for each routing destination
   - Custom field IDs for task metadata

3. To find custom field IDs:
   - Open ClickUp workspace
   - Go to Settings → Custom Fields
   - Note the ID for each field (Entity, DRI, SLA, sla_due_at, dispatched_at, dispatched_by_rule)

## Routing Rules

The script matches task titles and descriptions against these keyword patterns:

| Rule | Keywords | Target Queue | SLA |
|------|----------|--------------|-----|
| Decision Queue | decision, approve, approval, sign off | Decision Queue | 24h |
| Blockers | blocked, stale, waiting on, stuck | Blockers | 24h |
| Business & Legal | contract, legal, nda, agreement, compliance | W1 Business & Legal | 72h |
| Tech Buildout | bug, deploy, database, server, crash | W2 Tech Buildout | 24h |
| Artist Onboarding | onboard, signup, artist portal | W3 Artist Onboarding | 168h |
| Pre-Launch Marketing | launch, campaign, release, promo, marketing | W4 Pre-Launch Marketing | 168h |
| Fan Experience | fan, engagement, community, dm | W5 Fan Experience | 168h |
| Ongoing Ops | (catch-all — no keyword match) | W6 Ongoing Ops | 168h |

## Escalation Detection

Tasks matching any of these keywords are flagged for manual review instead of auto-routing:
- Board mentions
- Legal disputes
- Money (with K suffix or currency)
- Artist termination
- Contract breach
- Catalog changes
- References to "Corrum" or "JCH"

## Usage

Run the router:
```bash
npm start
```

Or directly:
```bash
node intake-router.js
```

## Output

The script produces a detailed routing summary table showing:
- **Successfully Routed**: Tasks moved to correct queues with SLA set
- **Flagged for Manual Review**: Tasks with escalation keywords
- **Failed**: Tasks that could not be routed due to configuration or API errors
- **Queue Distribution**: Summary of how many tasks went to each queue

### Example Output
```
==================================================================================================
ROUTING SUMMARY
==================================================================================================

✓ Successfully Routed: 32
  • Fix critical bug in payment processing → W2 Tech Buildout (24h)
  • Waiting for legal team approval → Blockers (24h)
  • New artist onboarding flow → W3 Artist Onboarding (168h)
  ...

⚠ Flagged for Manual Review: 3
  • Board meeting - artist contract negotiation (Escalation keyword detected)
  ...

✗ Failed: 1
  • Some task - Missing list ID for W2 Tech Buildout

==================================================================================================
QUEUE DISTRIBUTION
==================================================================================================
  Decision Queue: 2
  Blockers: 4
  W1 Business & Legal: 1
  W2 Tech Buildout: 8
  W3 Artist Onboarding: 5
  W4 Pre-Launch Marketing: 6
  W5 Fan Experience: 4
  W6 Ongoing Ops: 2

==================================================================================================
Total Processed: 36 | Routed: 32 | Escalated: 3 | Failed: 1
==================================================================================================
```

## Per-Task Actions

For each routed task, the script:

1. **Fetches** the task from the Intake list
2. **Matches** title + description against routing rules (keyword scan)
3. **Sets custom fields**:
   - `Entity`: Queue name
   - `DRI`: (if configured)
   - `SLA`: Hours (e.g., "24h")
   - `sla_due_at`: ISO timestamp of deadline
   - `dispatched_at`: Timestamp of routing
   - `dispatched_by_rule`: Rule name that matched
4. **Moves** the task to the target list
5. **Adds comment** with routing rationale and matched rule

## Acceptance Criteria

- ✓ All 36 pending intake tasks routed to correct queues
- ✓ Each task has custom fields populated
- ✓ Routing decisions logged in ClickUp task comments
- ✓ Script exits 0 with clean routing summary

## Phase 2 (Scheduled Automation)

After approval, Phase 2 will:
- Run the router on a schedule (e.g., hourly or on webhook)
- Store routing logs in database
- Send alerts for escalations
- Provide admin dashboard for rule tuning

## Troubleshooting

### "CLICKUP_API_KEY is required"
Set `CLICKUP_API_KEY` in `.env` or pass as environment variable:
```bash
CLICKUP_API_KEY=xxx npm start
```

### "Target list ID not configured"
Ensure all target queue IDs are set in `.env` for the routing rules you're using.

### Custom fields not updating
Verify custom field IDs are correct. Field IDs can be found in ClickUp API docs or by checking task custom field structure via API.

### Task not moving
Check that the API key has write permissions and that the target list exists and is accessible.

## Development

### Environment Variables (.env.local for local overrides)
```bash
# Override any .env setting for local testing
CLICKUP_API_KEY=test_key
INTAKE_LIST_ID=999999999999
```

### Logging
Add debug logging by setting:
```bash
DEBUG=* npm start
```

## License

Internal use only.
