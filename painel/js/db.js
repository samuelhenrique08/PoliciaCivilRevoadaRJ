/* ============================================================
   DATABASE — Funções de acesso ao Supabase
   ============================================================ */
import { supabase } from './supabase-config.js';

/* -------- COMANDO ATUAL -------- */
export async function getComandoAtual() {
    const { data, error } = await supabase
        .from('comando_atual')
        .select('*')
        .order('ordem', { ascending: true });
    if (error) throw error;
    return data || [];
}

export async function salvarComandoAtual(lista) {
    // Apaga tudo e insere de novo (simples e eficaz)
    const { error: errDelete } = await supabase
        .from('comando_atual')
        .delete()
        .neq('id', 0);
    if (errDelete) throw errDelete;

    const { error: errInsert } = await supabase
        .from('comando_atual')
        .insert(lista);
    if (errInsert) throw errInsert;

    return true;
}

/* -------- HIERARQUIA -------- */
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

    const { error: errInsert } = await supabase
        .from('hierarquia')
        .insert(lista);
    if (errInsert) throw errInsert;

    return true;
}

/* -------- AVISOS -------- */
export async function getAvisos() {
    const { data, error } = await supabase
        .from('avisos')
        .select('*')
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

/* -------- CONCURSOS -------- */
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

/* -------- GALERIA -------- */
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