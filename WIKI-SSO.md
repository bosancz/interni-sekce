# Wiki.js SSO (Single Sign-On)

Lets users open **wiki.bosan.cz** and be logged in automatically with their Bošán
account — no second email/password prompt.

## How it works

The backend acts as an **OAuth2 identity provider** (authorization-code flow).
Wiki.js is configured as a _Generic OAuth2_ client pointing at it.

```
Browser ──"Wiki"──▶ /login/<key> (Wiki.js)
        ──▶ GET  {APP}/api/oauth/authorize   (reads the `token` session cookie, issues a code)
        ──▶ redirect back to Wiki.js with ?code=...
Wiki.js ──▶ POST {APP}/api/oauth/token       (code → access token, server-to-server)
        ──▶ GET  {APP}/api/oauth/userinfo     (access token → email + name)
        ──▶ user is logged into Wiki.js
```

Because the user is already logged into the app (session cookie), the
`/authorize` step approves silently and bounces straight back — the login is
invisible.

> The user's **password is never involved**. The app only holds a JWT session,
> never the plaintext password, so it cannot (and must not) be forwarded. SSO is
> the correct, secure way to achieve one-click access.

## Backend endpoints (already implemented)

Under the app's public base URL (`{APP}` = value of `BASE_URL`, e.g. `https://bosan.cz`):

| Endpoint                         | Purpose                |
| -------------------------------- | ---------------------- |
| `GET  {APP}/api/oauth/authorize` | Authorization endpoint |
| `POST {APP}/api/oauth/token`     | Token endpoint         |
| `GET  {APP}/api/oauth/userinfo`  | User info endpoint     |

## 1. Configure the backend (env vars)

Set these in `backend/.env` (see `.env.template`):

```
OAUTH_WIKI_CLIENT_ID=bosan-wiki
OAUTH_WIKI_CLIENT_SECRET=<long random secret, e.g. `openssl rand -hex 32`>
OAUTH_WIKI_REDIRECT_URI=https://wiki.bosan.cz/login/<strategyKey>/callback
```

`<strategyKey>` comes from Wiki.js in step 2 — you'll fill it in and restart the
backend afterwards. Also make sure `BASE_URL` is set to the app's public URL.

## 2. Configure Wiki.js

In Wiki.js: **Administration → Authentication → + Add Strategy → Generic OAuth2**.

| Field                      | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Client ID                  | `bosan-wiki` (must match `OAUTH_WIKI_CLIENT_ID`)                     |
| Client Secret              | the same secret as `OAUTH_WIKI_CLIENT_SECRET`                        |
| Authorization Endpoint URL | `{APP}/api/oauth/authorize`                                          |
| Token Endpoint URL         | `{APP}/api/oauth/token`                                              |
| User Info Endpoint URL     | `{APP}/api/oauth/userinfo`                                           |
| Scope                      | `openid profile email` (any non-empty value; the backend ignores it) |
| User ID claim              | `sub`                                                                |
| Display Name claim         | `name`                                                               |
| Email claim                | `email`                                                              |

Enable:

- **Allow self-registration** — so first-time users get a Wiki.js account
  automatically (you chose "no user should be rejected").
- Assign the **default group** newly-registered users should land in.

Save. Wiki.js shows the strategy's **callback/redirect URL** — it looks like
`https://wiki.bosan.cz/login/<strategyKey>/callback`. Copy the `<strategyKey>`
into `OAUTH_WIKI_REDIRECT_URI` (step 1) and **restart the backend**.

## 3. Wire the "Wiki" button to deep-link through SSO

Once you know `<strategyKey>`, point the home dashboard's Wiki button straight at
the Wiki.js strategy login URL so it skips the wiki's own login page:

`frontend/src/app/features/home/components/home-dashboard/home-dashboard.component.html`

```html
<a href="https://wiki.bosan.cz/login/<strategyKey>" target="_blank" rel="noopener" ...></a>
```

(Until then it links to `https://wiki.bosan.cz`, where the user can click
"Login with Bošán" manually.)

## Security notes

- **redirect_uri** is validated against an exact allowlist (the configured value)
  to prevent open-redirect / code interception.
- Authorization codes live **60 s**, access tokens **5 min** — just long enough
  for the exchange.
- Codes/tokens are signed JWTs carrying a `type` claim (`oauth_code` /
  `oauth_access`); they are structurally distinct from the user session token, so
  none can be substituted for another.
- The token endpoint requires the client secret (via body or HTTP Basic).
