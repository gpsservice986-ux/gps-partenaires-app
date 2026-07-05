import { supabase } from './supabase';

// ── PARTENAIRES ──────────────────────────────────────────────

export async function getPartners() {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('rank', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addPartner(partner) {
  const { data, error } = await supabase
    .from('partners')
    .insert([partner])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePartner(id, fields) {
  const { error } = await supabase
    .from('partners')
    .update(fields)
    .eq('id', id);
  if (error) throw error;
}

export async function blockPartner(id, reason) {
  const { error } = await supabase
    .from('partners')
    .update({ is_blocked: true, block_reason: reason })
    .eq('id', id);
  if (error) throw error;
}

export async function unblockPartner(id) {
  const { error } = await supabase
    .from('partners')
    .update({ is_blocked: false, block_reason: null })
    .eq('id', id);
  if (error) throw error;
}

export async function loginPartner(username) {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('username', username)
    .single();
  if (error) return null;
  return data;
}

// ── CLIENTS ──────────────────────────────────────────────────

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getClientsByPartner(partnerId) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(id, fields) {
  const { error } = await supabase
    .from('clients')
    .update(fields)
    .eq('id', id);
  if (error) throw error;
}

export async function validatePurchase(clientId, gpsData, partnerId) {
  // Met à jour le client avec les infos GPS
  const { error } = await supabase
    .from('clients')
    .update({
      status: 'achete',
      gps_brand: gpsData.gpsBrand,
      gps_model: gpsData.gpsModel,
      gps_price: gpsData.gpsPrice,
      gps_imei: gpsData.gpsImei,
      gps_sim: gpsData.gpsSim,
      sim_international: gpsData.sim,
      purchase_date: gpsData.purchaseDate,
    })
    .eq('id', clientId);
  if (error) throw error;

  // Crédite la commission au partenaire (5000 F par défaut)
  await supabase.rpc('credit_commission', {
    p_partner_id: partnerId,
    p_client_id: clientId,
    p_amount: 5000,
    p_reason: 'Vente GPS'
  });
}

export async function searchClient(term) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`phone.ilike.%${term}%,full_name.ilike.%${term}%`);
  if (error) throw error;
  return data || [];
}

// ── TÉMOINS ──────────────────────────────────────────────────

export async function addWitnesses(clientId, witnesses) {
  const rows = witnesses
    .filter(w => w.name)
    .map(w => ({
      client_id: clientId,
      full_name: w.name,
      phone: w.phone,
      address: w.address,
      id_type: w.idType,
      id_number: w.idNumber,
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('witnesses').insert(rows);
  if (error) throw error;
}

export async function getWitnesses(clientId) {
  const { data, error } = await supabase
    .from('witnesses')
    .select('*')
    .eq('client_id', clientId);
  if (error) throw error;
  return data || [];
}

// ── PAIEMENTS ────────────────────────────────────────────────

export async function getPayments(clientId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addPayment(payment) {
  const { data, error } = await supabase
    .from('payments')
    .insert([payment])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── OPÉRATIONS ───────────────────────────────────────────────

export async function getOperations(clientId) {
  const { data, error } = await supabase
    .from('operations')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addOperation(operation) {
  const { data, error } = await supabase
    .from('operations')
    .insert([operation])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── RETRAITS ─────────────────────────────────────────────────

export async function getWithdrawals() {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getWithdrawalsByPartner(partnerId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addWithdrawal(withdrawal) {
  const { error } = await supabase
    .from('withdrawals')
    .insert([withdrawal]);
  if (error) throw error;
}

export async function validateWithdrawal(id, partnerId, amount) {
  // Valide le retrait
  const { error } = await supabase
    .from('withdrawals')
    .update({ status: 'valide', validated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;

  // Déduit du solde partenaire
  const { data: partner } = await supabase
    .from('partners')
    .select('balance')
    .eq('id', partnerId)
    .single();
  if (partner) {
    await supabase
      .from('partners')
      .update({ balance: Math.max(0, partner.balance - amount) })
      .eq('id', partnerId);
  }
}

// ── MESSAGES ─────────────────────────────────────────────────

export async function getMessages(partnerId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage(partnerId, sender, content) {
  const { error } = await supabase
    .from('messages')
    .insert([{ partner_id: partnerId, sender, content }]);
  if (error) throw error;
}

export async function subscribeToMessages(partnerId, callback) {
  return supabase
    .channel(`messages_${partnerId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `partner_id=eq.${partnerId}`
    }, callback)
    .subscribe();
}

// ── COMMISSIONS ──────────────────────────────────────────────

export async function getCommissions(partnerId) {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── STATS ────────────────────────────────────────────────────

export async function getPartnerStats() {
  const { data, error } = await supabase
    .from('v_partner_stats')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function getMonthlyRanking() {
  const { data, error } = await supabase
    .from('v_monthly_ranking')
    .select('*')
    .order('monthly_rank', { ascending: true });
  if (error) throw error;
  return data || [];
}