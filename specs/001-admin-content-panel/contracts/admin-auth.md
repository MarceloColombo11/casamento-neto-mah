# Contract: Autenticação dos noivos

Todas as mutações e GETs de `/admin` (exceto a página de login) exigem cookie `admin_session` válido. Identificador e senha nunca voltam no JSON.

## `login` — Server Action

**Entrada (FormData):** `identifier`, `password`

**Sucesso:** set-cookie `admin_session`; redirect `/admin`

**Falha (credencial):** mensagem genérica `"Não foi possível entrar. Confira os dados e tente de novo."` — não distingue usuário/senha. HTTP 200 da action com `{ ok: false, error }`.

**Falha (rate limit):** mesma mensagem genérica + `{ ok: false, error }` após 5 falhas / 15 min / IP. Não revela o bloqueio de forma que ajude brute force; pode acrescentar `"Tente novamente em alguns minutos."` se já bloqueado.

**Efeitos:** INSERT `admin_login_attempts`. Log: `{ ip_hash, success }` sem senha.

## `logout` — Server Action

Apaga `admin_session`. Redirect `/admin/login`.

## `GET /admin/login`

Público. Se cookie já válido, redirect `/admin`. Sem link a partir do site público.

## `GET /admin` e `/admin/*` (painel)

Sem cookie válido: redirect `/admin/login` (proxy + layout). Não renderiza listas.

## Cookie

| Atributo | Valor |
|----------|--------|
| Name | `admin_session` |
| HttpOnly | true |
| Secure | true em produção |
| SameSite | Lax |
| Path | `/` (Server Actions em `/admin/*` e Route Handlers em `/api/admin/media/*`) |
| Max-Age | 28800 |

Proxy matcher não aplica a `/admin/login`. Escritas em `/api/admin/media` checam Origin (mesmo critério do RSVP) além do cookie.
