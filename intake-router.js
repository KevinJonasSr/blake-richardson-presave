import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.CLICKUP_API_KEY;
const INTAKE_LIST_ID = process.env.INTAKE_LIST_ID;

if (!API_KEY || !INTAKE_LIST_ID) {
  console.error('ERROR: CLICKUP_API_KEY and INTAKE_LIST_ID must be set in .env');
  process.exit(1);
}

const ROUTING_RULES = [
  {
    name: 'Decision Queue',
    keywords: ['decision', 'approve', 'approval', 'sign off'],
    targetListId: process.env.DECISION_QUEUE_ID,
    sla: 24,
  },
  {
    name: 'Blockers',
    keywords: ['blocked', 'stale', 'waiting on', 'stuck'],
    targetListId: process.env.BLOCKERS_QUEUE_ID,
    sla: 24,
  },
  {
    name: 'W1 Business & Legal',
    keywords: ['contract', 'legal', 'nda', 'agreement', 'compliance'],
    targetListId: process.env.W1_BUSINESS_LEGAL_ID,
    sla: 72,
  },
  {
    name: 'W2 Tech Buildout',
    keywords: ['bug', 'deploy', 'database', 'server', 'crash'],
    targetListId: process.env.W2_TECH_BUILDOUT_ID,
    sla: 24,
  },
  {
    name: 'W3 Artist Onboarding',
    keywords: ['onboard', 'signup', 'artist portal'],
    targetListId: process.env.W3_ARTIST_ONBOARDING_ID,
    sla: 168,
  },
  {
    name: 'W4 Pre-Launch Marketing',
    keywords: ['launch', 'campaign', 'release', 'promo', 'marketing'],
    targetListId: process.env.W4_PRELAUNCH_MARKETING_ID,
    sla: 168,
  },
  {
    name: 'W5 Fan Experience',
    keywords: ['fan', 'engagement', 'community', 'dm'],
    targetListId: process.env.W5_FAN_EXPERIENCE_ID,
    sla: 168,
  },
  {
    name: 'W6 Ongoing Ops',
    keywords: [],
    targetListId: process.env.W6_ONGOING_OPS_ID,
    sla: 168,
  },
];

const ESCALATION_KEYWORDS = [
  'board',
  'legal dispute',
  'artist termination',
  'contract breach',
  'catalog change',
  'corrum',
  'jch',
];

const client = axios.create({
  baseURL: 'https://api.clickup.com/api/v2',
  headers: {
    'Authorization': API_KEY,
  },
});

async function fetchIntakeTasks() {
  try {
    const response = await client.get(`/list/${INTAKE_LIST_ID}/task?include_closed=false`);
    return response.data.tasks || [];
  } catch (error) {
    console.error('Error fetching intake tasks:', error.response?.data || error.message);
    throw error;
  }
}

function matchRoutingRule(task) {
  const text = `${task.name} ${task.description || ''}`.toLowerCase();

  // Check for escalation keywords
  const escalated = ESCALATION_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
  if (escalated) {
    return { rule: null, escalated: true, reason: 'Escalation keyword detected' };
  }

  // Match against routing rules
  for (const rule of ROUTING_RULES) {
    if (rule.keywords.length === 0) continue;
    if (rule.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return { rule, escalated: false, reason: `Matched keywords: ${rule.keywords.join(', ')}` };
    }
  }

  // Catch-all to W6 Ongoing Ops
  const catchAll = ROUTING_RULES.find(r => r.name === 'W6 Ongoing Ops');
  return { rule: catchAll, escalated: false, reason: 'No keyword match - routed to catch-all' };
}

async function updateTaskFields(taskId, rule) {
  const customFields = [];

  if (process.env.DISPATCHED_AT_FIELD_ID) {
    customFields.push({
      id: process.env.DISPATCHED_AT_FIELD_ID,
      value: new Date().toISOString(),
    });
  }

  if (process.env.DISPATCHED_BY_RULE_FIELD_ID && rule) {
    customFields.push({
      id: process.env.DISPATCHED_BY_RULE_FIELD_ID,
      value: rule.name,
    });
  }

  if (process.env.SLA_FIELD_ID && rule) {
    customFields.push({
      id: process.env.SLA_FIELD_ID,
      value: `${rule.sla}h`,
    });
  }

  if (process.env.SLA_DUE_AT_FIELD_ID && rule) {
    const dueDate = new Date(Date.now() + rule.sla * 60 * 60 * 1000);
    customFields.push({
      id: process.env.SLA_DUE_AT_FIELD_ID,
      value: dueDate.toISOString(),
    });
  }

  if (customFields.length > 0) {
    try {
      await client.put(`/task/${taskId}`, {
        custom_fields: customFields,
      });
    } catch (error) {
      console.warn(`Warning: Could not update custom fields for task ${taskId}:`, error.message);
    }
  }
}

async function moveTask(taskId, targetListId) {
  try {
    await client.post(`/task/${taskId}/move`, {
      list_id: targetListId,
    });
  } catch (error) {
    console.error(`Error moving task ${taskId}:`, error.response?.data || error.message);
    throw error;
  }
}

async function addTaskComment(taskId, comment) {
  try {
    await client.post(`/task/${taskId}/comment`, {
      comment_text: comment,
    });
  } catch (error) {
    console.warn(`Warning: Could not add comment to task ${taskId}:`, error.message);
  }
}

async function routeTask(task) {
  const result = matchRoutingRule(task);

  if (result.escalated) {
    return {
      taskId: task.id,
      taskName: task.name,
      status: 'ESCALATED',
      destination: 'Manual Review',
      rule: null,
      reason: result.reason,
      error: null,
    };
  }

  const rule = result.rule;
  if (!rule || !rule.targetListId) {
    return {
      taskId: task.id,
      taskName: task.name,
      status: 'FAILED',
      destination: 'Unknown',
      rule: rule?.name || 'None',
      reason: 'Target list ID not configured',
      error: `Missing list ID for ${rule?.name || 'catch-all'}`,
    };
  }

  try {
    await updateTaskFields(task.id, rule);
    await moveTask(task.id, rule.targetListId);
    const comment = `🚀 Auto-routed to "${rule.name}" (SLA: ${rule.sla}h)\n\nReason: ${result.reason}`;
    await addTaskComment(task.id, comment);

    return {
      taskId: task.id,
      taskName: task.name,
      status: 'ROUTED',
      destination: rule.name,
      rule: rule.name,
      reason: result.reason,
      sla: `${rule.sla}h`,
      error: null,
    };
  } catch (error) {
    return {
      taskId: task.id,
      taskName: task.name,
      status: 'FAILED',
      destination: rule.name,
      rule: rule.name,
      reason: result.reason,
      error: error.message,
    };
  }
}

function printSummaryTable(results) {
  const routed = results.filter(r => r.status === 'ROUTED');
  const escalated = results.filter(r => r.status === 'ESCALATED');
  const failed = results.filter(r => r.status === 'FAILED');

  console.log('\n' + '='.repeat(100));
  console.log('ROUTING SUMMARY');
  console.log('='.repeat(100));

  console.log(`\n✓ Successfully Routed: ${routed.length}`);
  routed.forEach(r => {
    console.log(`  • ${r.taskName.substring(0, 50)} → ${r.destination} (${r.sla})`);
  });

  if (escalated.length > 0) {
    console.log(`\n⚠ Flagged for Manual Review: ${escalated.length}`);
    escalated.forEach(r => {
      console.log(`  • ${r.taskName.substring(0, 50)} (${r.reason})`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n✗ Failed: ${failed.length}`);
    failed.forEach(r => {
      console.log(`  • ${r.taskName.substring(0, 50)} - ${r.error}`);
    });
  }

  const stats = {
    'Decision Queue': routed.filter(r => r.destination === 'Decision Queue').length,
    'Blockers': routed.filter(r => r.destination === 'Blockers').length,
    'W1 Business & Legal': routed.filter(r => r.destination === 'W1 Business & Legal').length,
    'W2 Tech Buildout': routed.filter(r => r.destination === 'W2 Tech Buildout').length,
    'W3 Artist Onboarding': routed.filter(r => r.destination === 'W3 Artist Onboarding').length,
    'W4 Pre-Launch Marketing': routed.filter(r => r.destination === 'W4 Pre-Launch Marketing').length,
    'W5 Fan Experience': routed.filter(r => r.destination === 'W5 Fan Experience').length,
    'W6 Ongoing Ops': routed.filter(r => r.destination === 'W6 Ongoing Ops').length,
  };

  console.log('\n' + '-'.repeat(100));
  console.log('QUEUE DISTRIBUTION');
  console.log('-'.repeat(100));
  Object.entries(stats)
    .filter(([_, count]) => count > 0)
    .forEach(([queue, count]) => {
      console.log(`  ${queue}: ${count}`);
    });

  console.log('\n' + '='.repeat(100));
  console.log(`Total Processed: ${results.length} | Routed: ${routed.length} | Escalated: ${escalated.length} | Failed: ${failed.length}`);
  console.log('='.repeat(100) + '\n');

  return { routed: routed.length, escalated: escalated.length, failed: failed.length };
}

async function main() {
  console.log('🔄 ClickUp Intake Router - Phase 1\n');
  console.log(`Intake List ID: ${INTAKE_LIST_ID}`);
  console.log('Fetching pending tasks...\n');

  try {
    const tasks = await fetchIntakeTasks();

    if (tasks.length === 0) {
      console.log('No pending tasks found in intake list.');
      process.exit(0);
    }

    console.log(`Found ${tasks.length} pending task(s). Starting routing...\n`);

    const results = [];
    for (const task of tasks) {
      const result = await routeTask(task);
      results.push(result);
      const statusIcon = result.status === 'ROUTED' ? '✓' : result.status === 'ESCALATED' ? '⚠' : '✗';
      console.log(`${statusIcon} [${result.status}] ${result.taskName.substring(0, 60)}`);
    }

    const summary = printSummaryTable(results);

    // Exit with 0 if at least some tasks were routed, even if some failed
    if (summary.routed > 0 || summary.escalated > 0) {
      process.exit(0);
    } else if (summary.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
