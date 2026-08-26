<div align="center">

# 🐛 SECRET_BUG

**A real-time social deduction game for software developers.**

[![Publish Docker image](https://github.com/matteomasciari/secretbug/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/matteomasciari/secretbug/actions/workflows/docker-publish.yml)
[![License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg?style=flat-square&logo=creative-commons)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-black?logo=socket.io)](https://socket.io)
[![Docker](https://img.shields.io/badge/ghcr.io-matteomasciari%2Fsecretbug-2496ED?logo=docker&logoColor=white)](https://github.com/matteomasciari/secretbug/pkgs/container/secretbug)

</div>

---

Two teams. One traitor. Five to a hundred engineers deciding, round after
round, whether to trust the person about to review their pull request.

**DevOps** wants to ship. **Hackers** want to sneak critical bugs into
production — and if nobody notices who the **Junior Dev** is before it's too
late, they win outright. Every game is server-authoritative: secret roles
never touch a client that isn't allowed to see them.

## How it plays

Secret Bug is a line-for-line re-skin of the Secret Hitler social deduction
game, dressed up as a software team under deadline pressure:

| Secret Hitler       | Secret Bug                                           |
| -------------------- | ----------------------------------------------------- |
| Liberal team          | **DevOps Team** — ship 5 Release Stabili, or catch the Junior Dev |
| Fascist team          | **Hacker Team** — merge 3 Bug Critici, or get the Junior Dev appointed Code Reviewer |
| Hitler                | **Junior Dev** — knows nothing; doesn't know who the Hackers are |
| President              | **Lead Engineer** — rotates every round, nominates the reviewer |
| Chancellor             | **Code Reviewer** — nominated, then voted in by the room |
| Liberal policy         | **RELEASE STABILE** (green) |
| Fascist policy         | **BUG CRITICO** (red) |
| Ja! / Nein!            | **APPROVA** / **REJECT** |
| Election tracker       | **Deploy Failure Counter** — 3 rejected votes in a row auto-merges the top PR |

A round: the Lead Engineer nominates a Code Reviewer → the table votes
APPROVA/REJECT → on approval, the Lead Engineer reviews 3 pull requests and
passes 2 along → the Code Reviewer discards 1 and merges the other. Repeat
until a team hits its win condition.

## Features

- ⚡ **Real-time everything** — Socket.IO-driven lobby, voting, and legislative
  session with per-player state, not polling.
- 🔒 **Server-authoritative roles** — the server redacts game state per
  socket; a client only ever receives what that player is allowed to know.
- 🔑 **Password-protected lobbies** — host a private game, browse public ones,
  reconnect into an in-progress match after a refresh.
- 🧑‍🤝‍🧑 **5 to 100 players** — role distribution scales automatically past the
  classic 10-player table.
- 🖥️ **Terminal aesthetic** — dark mode, neon-green/crimson cyberpunk theme,
  a live activity log that reads like a deploy pipeline.

## Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS,
  shadcn/ui, Lucide Icons
- **Realtime/backend:** Node.js custom server + Socket.IO, driving a
  server-side game state machine (`LOBBY → NIGHT → NOMINATION → VOTING →
  LEGISLATIVE_PRESIDENT → LEGISLATIVE_CHANCELLOR → EXECUTION → GAME_OVER`)
- **Runtime:** [`tsx`](https://github.com/privatenumber/tsx) executes the
  TypeScript server directly — no separate compile step for `server.ts`

## Getting started

Requires Node.js 22+.

```bash
git clone https://github.com/matteomasciari/secretbug.git
cd secretbug
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create a lobby. You
need at least 5 connected players to start a game.

```bash
npm run build   # production Next.js build
npm start       # NODE_ENV=production tsx server.ts
npm run lint    # eslint
```

## Running with Docker

A pre-built image is published to GHCR on every push to `main`:

```bash
docker run -p 3000:3000 ghcr.io/matteomasciari/secretbug:latest
```

Or build it locally:

```bash
docker build -t secretbug .
docker run -p 3000:3000 secretbug
```

The container listens on `$PORT` (default `3000`).

## Project structure

```
server.ts                    # boots Next.js + attaches the Socket.IO server
src/
  types/                     # shared domain types & socket event contracts
  server/
    gameEngine.ts            # the state machine: roles, votes, win conditions
    redact.ts                # the ONLY place secret roles cross the wire
    socketServer.ts          # Socket.IO event handlers
    rooms.ts, deck.ts, password.ts
  hooks/                     # useGameRoom, useLobbyBrowser
  components/
    lobby/                   # lobby browser, create/join modals
    room/                    # waiting room
    game/                    # board, tracks, voting, legislative panels
```

## Contributing

Issues and pull requests are welcome. If you're proposing a gameplay change,
please open an issue first describing the mechanic you'd like to adjust.

## Credits & Attribution

This project is an open-source, developer-themed re-skin inspired by the board game **Secret Hitler**, originally created by Goat, Wolf, & Cabbage LLC (Max Temkin, Mike Boxleiter, Tommy Maranges, and Mac Wingbrot). 

*Secret Bug* is an independent project and is not affiliated with, endorsed by, or sponsored by Goat, Wolf, & Cabbage LLC.

The game mechanics are used under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license.

## License

Licensed under the [Apache License 2.0](LICENSE).
