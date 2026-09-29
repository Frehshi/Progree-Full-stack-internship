# Task 3 - Task Dashboard

TaskFlow is a working full-stack task manager, not a static dashboard mock-up. A user can register or sign in, add a task, edit it, mark it complete, search and filter the list, or remove it. Tasks are stored in SQLite and remain tied to the account that created them.

## How it works

The React client talks to an Express REST API with asynchronous `fetch` requests. The server validates write requests with Zod and signs two-hour JWT access tokens. Passwords are hashed with bcrypt before storage. Every task query is scoped to the authenticated user, and the server reads that identity from the verified token rather than trusting a user ID from the browser.

The interface uses a table on larger screens and compact stacked rows on mobile. Loading, empty, error, editing, and selected states are all handled explicitly. A seeded demo account makes the workflow quick to review.

## What I tested

The API tests cover registration, login, rejected unauthorised requests, creation, editing, deletion, and the final task list. I also ran the same path through the browser: create a temporary task, confirm it appears, update it, and remove it.

This task made the separation between interface rules and security rules very clear. Disabling an action in React is useful feedback, but the ownership and validation checks still have to run on every server endpoint.
