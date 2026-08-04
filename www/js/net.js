/* Salón · red multijugador (Supabase Realtime) */
const Net = {
  URL: 'https://jvnmjybyhgtdzgxoqnig.supabase.co',
  KEY: 'sb_publishable_pOgb8WNi7sa0TlOhxc_8Fg_0QwMvdJI',
  sb: null, room: null, me: null, chan: null,

  async ready() {
    if (this.sb) return true;
    if (!window.supabase) {
      await new Promise((ok, ko) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
        s.onload = ok; s.onerror = ko; document.head.appendChild(s);
      }).catch(() => null);
    }
    if (!window.supabase) return false;
    this.sb = window.supabase.createClient(this.URL, this.KEY, { realtime: { params: { eventsPerSecond: 8 } } });
    return true;
  },
  code() { return Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join(''); },

  async create(game, name, max = 6, look = {}) {
    if (!await this.ready()) return { error: 'offline' };
    const code = this.code();
    const hostId = crypto.randomUUID();
    const { error } = await this.sb.from('salon_rooms').insert({ code, game, host_id: hostId, max_players: max });
    if (error) return { error: error.message };
    const { data } = await this.sb.from('salon_players')
      .insert({ room_code: code, name, seat: 1, is_host: true, avatar: look.avatar || '🙂', color: look.color || 0 }).select().single();
    this.room = code; this.me = data;
    return { code, me: data };
  },
  async join(code, name, look = {}) {
    if (!await this.ready()) return { error: 'offline' };
    const { data, error } = await this.sb.rpc('salon_join', { p_code: code.toUpperCase(), p_name: name });
    if (error) return { error: error.message };
    if (data.error) return { error: data.error };
    this.room = code.toUpperCase();
    this.me = { id: data.player_id, seat: data.seat, name };
    await this.sb.from('salon_players').update({ avatar: look.avatar || '🙂', color: look.color || 0 }).eq('id', data.player_id);
    return { code: this.room, me: this.me, game: data.game };
  },
  async players() {
    const { data } = await this.sb.from('salon_players').select('*').eq('room_code', this.room).order('seat');
    return data || [];
  },
  async roomInfo() {
    const { data } = await this.sb.from('salon_rooms').select('*').eq('code', this.room).single();
    return data;
  },
  async setState(state, extra = {}) {
    await this.sb.from('salon_rooms').update({ state, updated_at: new Date().toISOString(), ...extra }).eq('code', this.room);
  },
  async send(payload) {
    await this.sb.from('salon_moves').insert({ room_code: this.room, player_id: this.me.id, payload });
  },
  subscribe({ onPlayers, onRoom, onMove }) {
    this.unsubscribe();
    this.chan = this.sb.channel('salon:' + this.room)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_players', filter: 'room_code=eq.' + this.room },
        () => onPlayers && this.players().then(onPlayers))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'salon_rooms', filter: 'code=eq.' + this.room },
        p => onRoom && onRoom(p.new))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'salon_moves', filter: 'room_code=eq.' + this.room },
        p => onMove && onMove(p.new))
      .subscribe();
  },
  async addPoints(name, pts, avatar, color) {
    if (!await this.ready()) return null;
    const { data } = await this.sb.rpc('salon_add_points', { p_name: name, p_pts: pts, p_avatar: avatar || '🙂', p_color: color || 0 });
    return data;
  },
  async top(n = 20) {
    if (!await this.ready()) return [];
    const { data } = await this.sb.from('salon_scores').select('*').order('points', { ascending: false }).limit(n);
    return data || [];
  },
  unsubscribe() { if (this.chan) { this.sb.removeChannel(this.chan); this.chan = null; } },
  async leave() {
    try { if (this.me) await this.sb.from('salon_players').delete().eq('id', this.me.id); } catch (e) { }
    this.unsubscribe(); this.room = null; this.me = null;
  }
};
