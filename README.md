RUN  pip install -r requirements.txt   in backend folder  THEN CD to root folder
RUN python app.py

<img width="1790" height="630" alt="image" src="https://github.com/user-attachments/assets/6f5e9219-1727-4c5b-82db-700b6fda2999" />

<img width="1914" height="935" alt="image" src="https://github.com/user-attachments/assets/1ae25577-4da1-44e9-811c-cbb34c86f360" />

AI Usage Transparency Report
Problem 1 – Backend architecture for high‑rate ticks

Goal: Design a Python backend that can handle ~1000 ticks/second from Binance, compute rolling analytics (z‑score, volatility), and broadcast results to 100+ WebSocket clients with sub‑100 ms latency using only SQLite on a single machine.

Prompt (ChatGPT‑4):
“Design a Python backend architecture for real-time crypto trading analytics:

Stream 1000 ticks/second from Binance

Compute rolling statistics (z-score, volatility)

Broadcast to 100+ WebSocket clients

Sub-100ms latency requirement

Constraints: SQLite only (no external DB), single machine

Consider: async I/O, data buffering, database queries, API endpoints
Output: High-level architecture diagram (text format)”

Usage: Used ideas to shape the final FastAPI + WebSocket + SQLite design and data flow.

Validation: Cross‑checked with websockets and FastAPI docs, tested against real Binance streams, and checked latency under load.​

Problem 2 – React WebSocket hook and chart updates

Goal: Implement a React hook for real‑time WebSocket data that buffers the last N ticks, updates charts smoothly, handles reconnect logic, and avoids memory leaks.

Prompt (ChatGPT‑4):
“React component for real-time WebSocket data:

Connect on mount, disconnect on unmount

Buffer last 1000 ticks in state

Update charts every tick (no lag)

Handle reconnection

Avoid memory leaks

Use: React hooks (useState, useEffect, useRef)
Output: useEffect cleanup pattern shown.”

Usage: Used as a reference to build the useWebSocket custom hook and wire it into the dashboard charts.

Validation: Verified cleanup/unmount behavior, reconnection after backend restarts, and that memory usage stays stable during long runs.​

Problem 3 – SQLite thread safety and locking

Original issue: Using a fresh sqlite3.connect call for each insert from multiple async contexts caused “database is locked” errors and risked corruption.

Prompt (Claude):
“SQLite with asyncio: multiple inserts happening simultaneously; getting 'database is locked' errors. How to fix thread safety?”

Usage: Adopted the pattern of a shared connection protected by a Lock, and moved inserts into non‑blocking sections, which is now implemented in the TickDatabase class.

Validation: Stress‑tested with high tick rates; no “database is locked” errors observed and integrity is preserved.​

Problem 4 – Responsive dashboard layout (CSS)

Goal: Make the dashboard usable on different screen sizes with a sidebar + main content layout that degrades gracefully.

Prompt (ChatGPT‑4):
“CSS Grid responsive layout: sidebar + main content.

≥1600px: 2-column layout

~900px: 1-column stacked

~600px: hide or compress sidebar and maximize charts
Dark theme using slate‑like colors. Provide media query breakpoints.”

Usage: Used the suggested breakpoints and grid flex patterns to build the responsive layout in App.css.

Validation: Manually tested in the browser’s responsive mode at multiple widths and adjusted details to fit the project’s design.​

Problem 5 – Frontend modularization and library choices

Usage: AI was used to:

Refactor the React frontend into reusable components and group them into charts, layout, and ui subfolders for better modularity and reuse.

Brainstorm overall project approach and confirm suitable Python libraries (FastAPI, websockets, numpy, pandas, statsmodels, scipy) for real‑time analytics.

Validation: Final structure and dependencies were checked against official docs and common FastAPI/React project templates
