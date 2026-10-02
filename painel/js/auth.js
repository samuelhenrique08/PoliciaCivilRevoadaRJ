/* ============================================================
   AUTENTICAÇÃO — Supabase
   ============================================================ */
import { supabase } from './supabase-config.js';
import { toast } from './utils.js';

let usuarioAtual = null;

export function getUsuario() {
    return usuarioAtual;
}

export function temPermissao(secao) {
    if (!usuarioAtual) return false;
    const role = usuarioAtual.role;

    const permissoes = {
        master: ['dashboard', 'comando', 'membros', 'avisos', 'concursos', 'galeria'],
        editor: ['dashboard', 'avisos', 'concursos']
    };

    return (permissoes[role] || []).includes(secao);
}

/* -------- LOGIN -------- */
export async function login(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
    });
    if (error) throw error;
    return data.user;
}

/* -------- LOGOUT -------- */
export async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
}

/* -------- CARREGAR PERFIL -------- */
async function carregarPerfil(userId) {
    try {
        const { data, error } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            toast('Usuário não cadastrado no painel.', 'erro');
            await supabase.auth.signOut();
            return null;
        }

        if (!['master', 'editor'].includes(data.role)) {
            toast('Você não tem permissão para acessar o painel.', 'erro');
            await supabase.auth.signOut();
            return null;
        }

        return {
            uid: userId,
            email: (await supabase.auth.getUser()).data.user.email,
            nome: data.nome || 'Usuário',
            role: data.role,
            cargo: data.cargo || ''
        };
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        toast('Erro ao carregar perfil.', 'erro');
        return null;
    }
}

/* -------- OBSERVAR SESSÃO -------- */
export async function observarAuth(callbackLogado, callbackDeslogado) {
    // Verifica sessão atual
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
        const perfil = await carregarPerfil(session.user.id);
        if (perfil) {
            usuarioAtual = perfil;
            callbackLogado(perfil);
        } else {
            usuarioAtual = null;
            callbackDeslogado();
        }
    } else {
        usuarioAtual = null;
        callbackDeslogado();
    }

    // Escuta mudanças
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            const perfil = await carregarPerfil(session.user.id);
            if (perfil) {
                usuarioAtual = perfil;
                callbackLogado(perfil);
            }
        } else if (event === 'SIGNED_OUT') {
            usuarioAtual = null;
            callbackDeslogado();
        }
    });
}