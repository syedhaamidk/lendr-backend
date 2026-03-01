const cron = require('node-cron');
const fetch = require('node-fetch');

// Runs every day at 9:00 AM
// Replace `getLoansFromDB()` with your actual database query
cron.schedule('0 9 * * *', async () => {
  console.log('[Scheduler] Checking for due reminders...');

  try {
    // TODO: Replace this with a real DB query
    // Example with Supabase:
    // const { data: loans } = await supabase
    //   .from('loans')
    //   .select('*')
    //   .lte('due_date', new Date().toISOString())
    //   .eq('status', 'pending');

    const loans = []; // Replace with real DB query

    for (const loan of loans) {
      const res = await fetch(`http://localhost:${process.env.PORT || 4000}/api/reminders/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loan),
      });
      const data = await res.json();
      console.log(`[Scheduler] Reminder for ${loan.name}:`, data.results);
    }
  } catch (err) {
    console.error('[Scheduler] Error:', err.message);
  }
});

console.log('[Scheduler] Daily reminder cron started (9:00 AM)');
