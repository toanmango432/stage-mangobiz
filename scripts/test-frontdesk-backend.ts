/**
 * Front Desk Backend Test Script
 * 
 * Automated test script to verify all Front Desk data flows work correctly
 * with Supabase backend.
 * 
 * Run with: npx tsx scripts/test-frontdesk-backend.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (from src/services/supabase/client.ts)
const SUPABASE_URL = 'https://cpaldkcvdcdyzytosntc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWxka2N2ZGNkeXp5dG9zbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODMzNzIsImV4cCI6MjA3OTY1OTM3Mn0.A4tG6cf7Xk5Y0eGE-Wpx5-gX62neCnuD2QlRxZ2qOOQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

// Helper to add test result
function addResult(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}${error ? ` - ${error}` : ''}`);
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
}

// Test 1: Verify Supabase Connection
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('tickets').select('count').limit(1);
    if (error) throw error;
    addResult('Supabase Connection', true);
    return true;
  } catch (error: any) {
    addResult('Supabase Connection', false, error.message);
    return false;
  }
}

// Test 2: Verify Tickets Table Structure
async function testTicketsTableStructure() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, client_id, appointment_id, status, store_id, created_at')
      .limit(1);
    
    if (error) throw error;
    
    // Check if required columns exist by examining the response
    const hasRequiredColumns = data !== null;
    addResult('Tickets Table Structure', hasRequiredColumns, undefined, {
      columns: ['id', 'client_id', 'appointment_id', 'status', 'store_id', 'created_at']
    });
    return hasRequiredColumns;
  } catch (error: any) {
    addResult('Tickets Table Structure', false, error.message);
    return false;
  }
}

// Test 3: Verify Transactions Table Structure
async function testTransactionsTableStructure() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, ticket_id, client_id, total, payment_method, created_at')
      .limit(1);
    
    if (error) throw error;
    
    const hasRequiredColumns = data !== null;
    addResult('Transactions Table Structure', hasRequiredColumns, undefined, {
      columns: ['id', 'ticket_id', 'client_id', 'total', 'payment_method', 'created_at']
    });
    return hasRequiredColumns;
  } catch (error: any) {
    addResult('Transactions Table Structure', false, error.message);
    return false;
  }
}

// Test 4: Verify Appointments Table Structure
async function testAppointmentsTableStructure() {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, client_id, staff_id, status, store_id, created_at')
      .limit(1);
    
    if (error) throw error;
    
    const hasRequiredColumns = data !== null;
    addResult('Appointments Table Structure', hasRequiredColumns, undefined, {
      columns: ['id', 'client_id', 'staff_id', 'status', 'store_id', 'created_at']
    });
    return hasRequiredColumns;
  } catch (error: any) {
    addResult('Appointments Table Structure', false, error.message);
    return false;
  }
}

// Test 5: Check for Tickets with Appointment Links
async function testTicketsWithAppointments() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, appointment_id, client_id, status')
      .not('appointment_id', 'is', null)
      .limit(5);
    
    if (error) throw error;
    
    const count = data?.length || 0;
    const hasLinkedTickets = count > 0;
    
    addResult('Tickets with Appointment Links', hasLinkedTickets, undefined, {
      count,
      sample: data?.slice(0, 2)
    });
    return hasLinkedTickets;
  } catch (error: any) {
    addResult('Tickets with Appointment Links', false, error.message);
    return false;
  }
}

// Test 6: Check for Transactions Linked to Tickets
async function testTransactionsLinkedToTickets() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, ticket_id, client_id, total, status')
      .not('ticket_id', 'is', null)
      .limit(5);
    
    if (error) throw error;
    
    const count = data?.length || 0;
    const hasLinkedTransactions = count > 0;
    
    addResult('Transactions Linked to Tickets', hasLinkedTransactions, undefined, {
      count,
      sample: data?.slice(0, 2)
    });
    return hasLinkedTransactions;
  } catch (error: any) {
    addResult('Transactions Linked to Tickets', false, error.message);
    return false;
  }
}

// Test 7: Verify Data Consistency (Foreign Keys)
async function testDataConsistency() {
  try {
    // Get a transaction with ticket
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('id, ticket_id, client_id')
      .not('ticket_id', 'is', null)
      .limit(1);
    
    if (txnError) throw txnError;
    
    if (!transactions || transactions.length === 0) {
      addResult('Data Consistency Check', true, undefined, {
        note: 'No transactions found to verify'
      });
      return true;
    }
    
    const transaction = transactions[0];
    
    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, client_id')
      .eq('id', transaction.ticket_id)
      .single();
    
    if (ticketError) {
      addResult('Data Consistency Check', false, `Ticket ${transaction.ticket_id} not found`);
      return false;
    }
    
    // Verify client IDs match (if both have client_id)
    const clientIdsMatch = !transaction.client_id || !ticket.client_id || 
                          transaction.client_id === ticket.client_id;
    
    addResult('Data Consistency Check', clientIdsMatch, 
      clientIdsMatch ? undefined : 'Client IDs do not match', {
      transaction_id: transaction.id,
      ticket_id: transaction.ticket_id,
      transaction_client_id: transaction.client_id,
      ticket_client_id: ticket.client_id
    });
    
    return clientIdsMatch;
  } catch (error: any) {
    addResult('Data Consistency Check', false, error.message);
    return false;
  }
}

// Test 8: Check Recent Activity (Last 24 hours)
async function testRecentActivity() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check recent tickets
    const { data: recentTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, created_at')
      .gte('created_at', yesterday.toISOString())
      .limit(10);
    
    if (ticketsError) throw ticketsError;
    
    // Check recent transactions
    const { data: recentTransactions, error: txnError } = await supabase
      .from('transactions')
      .select('id, total, created_at')
      .gte('created_at', yesterday.toISOString())
      .limit(10);
    
    if (txnError) throw txnError;
    
    addResult('Recent Activity Check', true, undefined, {
      tickets_last_24h: recentTickets?.length || 0,
      transactions_last_24h: recentTransactions?.length || 0,
      sample_tickets: recentTickets?.slice(0, 3),
      sample_transactions: recentTransactions?.slice(0, 3)
    });
    
    return true;
  } catch (error: any) {
    addResult('Recent Activity Check', false, error.message);
    return false;
  }
}

// Test 9: Verify Status Transitions
async function testStatusTransitions() {
  try {
    // Check for tickets that have been updated (status transitions)
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, status, created_at, updated_at')
      .limit(10);
    
    if (error) throw error;
    
    // Check if any tickets have different created_at and updated_at
    const ticketsWithTransitions = tickets?.filter(t => {
      if (!t.created_at || !t.updated_at) return false;
      return new Date(t.updated_at).getTime() > new Date(t.created_at).getTime();
    }) || [];
    
    const hasStatusTransitions = ticketsWithTransitions.length > 0;
    
    addResult('Status Transitions', hasStatusTransitions, undefined, {
      total_tickets: tickets?.length || 0,
      tickets_with_transitions: ticketsWithTransitions.length,
      sample: ticketsWithTransitions.slice(0, 2)
    });
    
    return hasStatusTransitions;
  } catch (error: any) {
    addResult('Status Transitions', false, error.message);
    return false;
  }
}

// Test 10: Check for Orphaned Records
async function testOrphanedRecords() {
  try {
    // Check for transactions without valid tickets
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('id, ticket_id')
      .not('ticket_id', 'is', null)
      .limit(10);
    
    if (txnError) throw txnError;
    
    if (!transactions || transactions.length === 0) {
      addResult('Orphaned Records Check', true, undefined, {
        note: 'No transactions to check'
      });
      return true;
    }
    
    // Check each transaction's ticket exists
    let orphanedCount = 0;
    for (const txn of transactions) {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('id', txn.ticket_id)
        .single();
      
      if (error || !ticket) {
        orphanedCount++;
      }
    }
    
    const hasOrphans = orphanedCount > 0;
    
    addResult('Orphaned Records Check', !hasOrphans, 
      hasOrphans ? `${orphanedCount} orphaned transactions found` : undefined, {
      checked: transactions.length,
      orphaned: orphanedCount
    });
    
    return !hasOrphans;
  } catch (error: any) {
    addResult('Orphaned Records Check', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Front Desk Backend Test Suite\n');
  console.log('=' .repeat(60));
  console.log('Testing Supabase Backend Integration\n');
  
  // Run all tests
  await testSupabaseConnection();
  await testTicketsTableStructure();
  await testTransactionsTableStructure();
  await testAppointmentsTableStructure();
  await testTicketsWithAppointments();
  await testTransactionsLinkedToTickets();
  await testDataConsistency();
  await testRecentActivity();
  await testStatusTransitions();
  await testOrphanedRecords();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

