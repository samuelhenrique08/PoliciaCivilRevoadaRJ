/* ============================================================
   DATABASE — Funções de acesso ao Supabase
   ============================================================ */
import { supabase } from './supabase-config.js';

/* ============================================================
   COMANDO ATUAL
   ============================================================ */
export async function getComandoAtual() {
    const { data, error } = await supabase
        .from('comando_atual')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function salvarComandoAtual(lista) {
    // Apaga tudo e insere de novo
    const { error: errDelete } = await supabase
        .from('comando_atual')
        .delete()
        .neq('id', 0);

    if (errDelete) throw errDelete;

    if (lista.length === 0) return true;

    const { error: errInsert } = await supabase
        .from('comando_atual')
        .insert(lista);

    if (errInsert) throw errInsert;

    return true;
}

/* ============================================================
   HIERARQUIA
   ============================================================ */
export async function getHierarquia() {
    const { data, error } = await supabase
        .from('hierarquia')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function salvarHierarquia(lista) {
    const { error: errDelete } = await supabase
        .from('hierarquia')
        .delete()
        .neq('id', 0);

    if (errDelete) throw errDelete;

    if (lista.length === 0) return true;

    const { error: errInsert } = await supabase
        .from('hierarquia')
        .insert(lista);

    if (errInsert) throw errInsert;

    return true;
}

/* ============================================================
   AVISOS
   ============================================================ */
export async function getAvisos() {
    const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .order('destaque', { ascending: false })
        .order('criado_em', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function criarAviso(aviso) {
    const { data, error } = await supabase
        .from('avisos')
        .insert(aviso)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function atualizarAviso(id, dados) {
    const { data, error } = await supabase
        .from('avisos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletarAviso(id) {
    const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

/* ============================================================
   CONCURSOS
   ============================================================ */
export async function getConcursos() {
    const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function atualizarConcurso(slug, dados) {
    const { data, error } = await supabase
        .from('concursos')
        .update(dados)
        .eq('slug', slug)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function toggleVagas(slug, novoStatus) {
    const { error } = await supabase
        .from('concursos')
        .update({ vagas_status: novoStatus })
        .eq('slug', slug);

    if (error) throw error;
    return true;
}

/* ============================================================
   GALERIA
   ============================================================ */
export async function getGaleria() {
    const { data, error } = await supabase
        .from('galeria')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function criarItemGaleria(item) {
    const { data, error } = await supabase
        .from('galeria')
        .insert(item)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function atualizarItemGaleria(id, dados) {
    const { data, error } = await supabase
        .from('galeria')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletarItemGaleria(id) {
    const { error } = await supabase
        .from('galeria')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

/* ============================================================
   TUTORIAIS
   ============================================================ */
export async function getTutoriais(categoria = null) {
    let query = supabase
        .from('tutoriais')
        .select('*')
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: false });

    if (categoria) {
        query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function criarTutorial(tutorial) {
    const { data, error } = await supabase
        .from('tutoriais')
        .insert(tutorial)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function atualizarTutorial(id, dados) {
    const { data, error } = await supabase
        .from('tutoriais')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletarTutorial(id) {
    const { error } = await supabase
        .from('tutoriais')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

/* ============================================================
   CONTADORES (útil pra dashboard)
   ============================================================ */
export async function contarMembros() {
    const { data, error } = await supabase
        .from('hierarquia')
        .select('membros');

    if (error) throw error;

    const total = (data || []).reduce((acc, nivel) => {
        return acc + (Array.isArray(nivel.membros) ? nivel.membros.length : 0);
    }, 0);

    return total;
}

export async function contarAvisos() {
    const { count, error } = await supabase
        .from('avisos')
        .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
}

export async function contarGaleria() {
    const { count, error } = await supabase
        .from('galeria')
        .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
}

export async function contarTutoriais() {
    const { count, error } = await supabase
        .from('tutoriais')
        .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
}