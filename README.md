# PassRadar

A password breach and strength scanner that runs entirely in your browser —
no backend, no server, no password ever transmitted in full.

**Live demo:** https://fatimaalli.github.io/PassRadar/

## What it does

- **Breach check** — scans a password against the [Have I Been Pwned](https://haveibeenpwned.com/API/v3#PwnedPasswords)
  database of known-breached passwords, using the *k-anonymity* model: only
  a 5-character hash fragment ever leaves your browser, never the password
  itself.
- **Strength score** — calculates a Shannon-entropy-based strength estimate
  and displays it on a visual meter, so you get a signal even for passwords
  that aren't in any known breach.
- **Password generator** — creates a cryptographically random password
  locally using the Web Crypto API (`crypto.getRandomValues`), with an
  adjustable length slider and one-click copy.

## Why it's built this way

Most "check your password" tools either require you to trust a server with
your real password, or don't explain what they're doing with it at all.
PassRadar is a fully static site — everything (hashing, the breach lookup,
and password generation) happens client-side. Reading the source is enough
to verify that claim.

## Tech stack

Plain HTML, CSS, and JavaScript — no frameworks, no build step, no
dependencies. Uses:
- **Web Crypto API** (`crypto.subtle.digest`) for local SHA-1 hashing
- **Have I Been Pwned Pwned Passwords API** for breach lookups (CORS-enabled,
  so it can be called directly from the browser)
- **`crypto.getRandomValues`** for the password generator

## Project structure

```
passradar/
├── index.html      # page structure and content
├── css/
│   └── style.css   # all styling
├── js/
│   └── script.js   # hashing, breach lookup, entropy scoring, generator
├── README.md
└── LICENSE
```

## Why there's no backend or database

PassRadar doesn't store anything, by design. Every breach check queries
Have I Been Pwned's hosted database live over the network — there's no
data of ours to persist. Adding a database would only make sense for
features like saved scan history or user accounts, and a password tool
that remembers passwords is the opposite of what you want from one. The
fully static, client-only architecture isn't a missing piece — it's the
point: no server, anywhere, ever sees what you typed.

## Running it locally

Because the Web Crypto API requires a secure context, don't just double-click
`index.html`. Serve it locally instead:

```bash
# Option 1: Python (already installed on most systems)
python3 -m http.server 8000

# Option 2: Node
npx serve .
```

Then open `http://localhost:8000` in your browser.

## Possible extensions

- Warn on common password patterns (keyboard walks, repeated characters)
  in addition to raw entropy
- Add a light/dark theme toggle
- Batch-check a list of passwords from a file
- Package it as a small browser extension

## Disclaimer

Built as a hands-on project to understand breach-data APIs and client-side
cryptography. It's a learning/portfolio project, not a substitute for a
password manager or a production security tool.

## License

MIT — see [LICENSE](LICENSE).
