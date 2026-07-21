-- Enable Supabase Realtime for doctor portal subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE lab_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE clinical_messages;
