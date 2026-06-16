// Scheduled function skeleton. For real alerts, store watched routes in Supabase/Firestore
// and send notifications via Telegram Bot API, Resend, SendGrid, or email provider.
exports.handler = async () => ({ statusCode: 200, body: JSON.stringify({ ok:true, note:'Configure DB + Telegram/Email to activate real alerts.' }) });
