import { supabase } from '../lib/supabase';

export async function getGuideCategories() {
  const { data, error } = await supabase.from('guide_categories').select('id, label, icon').order('position');
  if (error) throw error;
  return data;
}

export async function getGuideTips(categoryId) {
  let query = supabase.from('guide_tips').select('id, category_id, title, hook, body, how, ages').order('position');
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Los tips de una franja de edad: '*' (todas) o su id en la lista separada por comas. */
export function tipsForAge(tips, profileId) {
  return tips.filter((t) => t.ages === '*' || t.ages.split(',').indexOf(profileId) >= 0);
}
