# Project Brief: AI Market Briefing Website

## 1. Project Purpose & Goal
The goal is to build a **static website** that displays AI-generated market briefings in Finnish. These briefings are generated multiple times per day by automated AI agents and are stored as standalone HTML files. The website's primary function is to serve as a clean, easily navigable archive of these reports, allowing the user to quickly grasp the current state of global markets.

## 2. Core Concept & User Flow
- **Agent-Generated Content:** AI agents (orchestrated via Activepieces and powered by OpenRouter) generate market reports as complete, standalone HTML documents (`<html>...</html>` with their own styling) at specific times of the day (e.g., 06:00, 10:00, 12:00). The content of each report is defined by a detailed prompt (e.g., focusing on US/Asian markets in the morning, European markets later, etc.).
- **Automatic File Handling:** The generated HTML files are **automatically** committed to a designated folder (e.g., `data/`) in the GitHub repository. This automation is a critical requirement.
- **Static Website:** The website itself is a frontend (HTML, CSS, JavaScript) that reads the list of available reports from the `data/` folder and displays them. It does not have a backend server.
- **User Experience:** The user visits the site, sees a list or menu of the latest reports (sorted by date/time), and clicks to read the full HTML content cleanly embedded on the page (e.g., via an iframe) without CSS conflicts.

## 3. Key Requirements
- **Report Generation:** A system must exist to run AI prompts at scheduled times and save the output as standalone `.html` files.
- **Automatic File Commit:** The system must automatically commit the generated `.html` files to the `data/` directory of the GitHub repository. Manual copying must be avoided.
- **Fixed Number of Time Slots:** Initially, there is a fixed number of daily reports (e.g., 3 slots: morning, Europe open, midday summary). The architecture should allow adding more slots later with minimal changes.
- **Frontend Functionality:** The website must dynamically list all available reports from the `data/` folder and render the selected standalone HTML report cleanly.
- **Public Repository & GitHub Pages Hosting:** The GitHub repository will be public so the frontend JavaScript can read the `data/` folder via the public GitHub Contents API without authentication tokens. The site will be hosted on GitHub Pages with the `docs/` folder as the source.

## 4. Technology Stack
- **Orchestration & AI Calls:** Activepieces (self-hosted or cloud) and OpenRouter API.
- **Development Environment:** VS Code with the Cline extension.
- **Version Control & Hosting:** GitHub (public repository) and GitHub Pages (hosting).
- **Frontend:** Vanilla HTML, CSS, and JavaScript. No complex frameworks are required for the initial version.

## 5. Proposed Architecture
1.  **Generation Layer:** Activepieces workflows are triggered by a schedule. They call the OpenRouter API with a specific prompt. The response (a complete HTML document) is saved.
2.  **Automation Layer:** The saved HTML file is automatically committed to the GitHub repository's `data/` folder. This can be achieved using Activepieces' GitHub integration or a GitHub Actions workflow.
3.  **Presentation Layer:** A static website in the `docs/` folder fetches the list of files in the `data/` folder (using the public GitHub Contents API) and renders the selected standalone HTML report (e.g., inside a responsive iframe) for the user.

## 6. Out of Scope (for initial version)
- User authentication.
- A backend database.
- Real-time data streaming.
- Complex content management systems (CMS).
