# AI tool disclosure

## Tools

- **Claude (Anthropic)**, used as a chat and coding assistant.
- **Google Antigravity (Gemini)**, used as a coding agent inside the editor.

## How we used AI

Team smoothOperator used AI assistants as a development aid throughout the development of Waypoint.

- **Code assistance:** AI was used to support the development of UI components, helper functions, boilerplate code, and other implementation tasks.
- **Human review and adaptation:** AI-generated suggestions were never used blindly. Every suggestion was reviewed, understood, and adapted by the team before being incorporated into the project. Suggestions that did not align with our design, requirements, or technical approach were rejected or rewritten.
- **Testing and verification:** AI-assisted code was tested and validated before being included in the project. This included automated unit tests (`npm test`) as well as manual testing of the application's screens, interactions, and user flows.
- **Debugging and bug resolution:** When technical issues or bugs were encountered, AI assistants were used to explore potential causes and solutions. These suggestions were treated as recommendations rather than authoritative answers, and fixes were independently reviewed, implemented, and verified by the team.

## AI-assisted

- Implementation of screens, API routes and helper code, with each member working on their own role's files.
- Infrastructure and setup: Docker Compose, the Cloud Run deployment and the GitHub Actions pipelines.
- Documentation drafts (README, architecture, data model, API contract), edited by the team.
- Exploring causes of bugs and possible fixes.

## Decided and done by the team

- The problem scope, the four roles, the personas and the degradation scenarios (from our Designathon submission).
- The domain rules: the fair chilled allocation rule, the 16:00 cutoff, back-orders for dock shortfalls, and how offline deliveries sync and resolve conflicts.
- The architecture, the data model and the choice of tools (Supabase, Socket.IO, Cloud Run).
- The visual design and design system, the final UI layouts and interactions.
- Task split, code review and merging of every pull request, testing, and the demo.

The Designathon submission had its own disclosure: Claude was used to explore ideas, refine screen concepts and wording, and the demo video narration was AI-generated (Kokoro text-to-speech).
