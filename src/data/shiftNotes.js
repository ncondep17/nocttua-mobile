import { supabase } from '../lib/supabase';

export async function getShiftNotes(familyId, limit = 3) {
  const { data, error } = await supabase
    .from('shift_notes')
    .select('id, text, created_at, profiles(display_name)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function addShiftNote(familyId, authorId, text) {
  const { error } = await supabase.from('shift_notes').insert({ family_id: familyId, author_id: authorId, text: text.trim() });
  if (error) throw error;
}
