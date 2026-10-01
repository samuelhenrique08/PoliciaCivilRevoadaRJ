/* ============================================================
   AUTENTICAÇÃO
   ============================================================ */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { toast } from './utils.js';

/* -------- USUÁRIO ATUAL -------- */
let usuarioAtual = null;

export function getUsuario() {
  return usuarioAtual;
}

export function temPermissao(secao) {
  if (!usuarioAtual) return false;
  const role = usuarioAtual.role;

  const permissoes = {
    master: ['dashboard', 'comando', 'membros', 'avisos', 'concursos', 'galeria', 'usuarios'],
    editor: ['dashboard', 'avisos', 'concursos']
  };

  return (permissoes[role] || []).includes(secao);
}

/* -------- LOGIN -------- */
export async function login(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

/* -------- LOGOUT -------- */
export async function logout() {
  await signOut(auth);
  window.location.reload();
}

/* -------- CARREGAR PERFIL DO FIRESTORE -------- */
async function carregarPerfil(uid) {
  try {
    const ref = doc(db, 'usuarios', uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      toast('Usuário não cadastrado no painel.', 'erro');
      await signOut(auth);
      return null;
    }

    const dados = snap.data();

    // Verificar se tem role permitida
    if (!['master', 'editor'].includes(dados.role)) {
      toast('Você não tem permissão para acessar o painel.', 'erro');
      await signOut(auth);
      return null;
    }

    return {
      uid,
      email: auth.currentUser.email,
      nome: dados.nome || 'Usuário',
      role: dados.role,
      cargo: dados.cargo || ''
    };
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    toast('Erro ao carregar perfil.', 'erro');
    return null;
  }
}

/* -------- OBSERVAR SESSÃO -------- */
export function observarAuth(callbackLogado, callbackDeslogado) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const perfil = await carregarPerfil(user.uid);
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
  });
}