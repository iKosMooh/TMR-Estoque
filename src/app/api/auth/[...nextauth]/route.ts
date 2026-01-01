// Temporariamente desabilitado devido a problemas de configuração com NextAuth v4
// TODO: Corrigir configuração do NextAuth
export const GET = () => new Response('Auth temporarily disabled', { status: 503 });
export const POST = () => new Response('Auth temporarily disabled', { status: 503 });