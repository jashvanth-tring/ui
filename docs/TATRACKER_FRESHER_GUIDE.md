# TA Tracker: A Fresher’s Guide

## 1. What is TA Tracker?

TA Tracker is an internal talent acquisition and recruitment tracking application. It helps a recruiting team keep hiring work in one place: client accounts, open job requirements, candidates, interview stages and feedback, offers, and reporting. It also includes administration tools for users, statuses, email templates, holidays, and activity logs.

The central idea is to connect a **requirement** (a client’s open role) with one or more **candidates**, then record each candidate’s progress through the hiring process we follow. Dashboards and reports summarize that work.

### Common terms

| Term | Meaning in this app |
| --- | --- |
| Client | The customer/company for whom the team is recruiting. A client can have locations and client contacts (SPOCs). |
| Designation / role | A job title or position type, such as a technical or business role. |
| Requirement | A specific hiring request: client, role, number of openings, experience, skills, dates, status, and related details. |
| Candidate | A person being considered for a role. Their profile can be associated with requirements and have a history of status changes. |
| Pipeline | The sequence of recruitment stages/statuses through which a candidate moves. |
| Round | An interview stage or interview record, including date, feedback, and completion state. |
| TA | Talent Acquisition / recruiter. |
| Gap analysis | A report that compares hiring activity or outcomes across configured categories. |
| SPOC | A client’s single point of contact. |

## 2. How the main workflow fits together

1. **Set up reference data.** Upload a JRF, the client and requirement will get populated
2. **Create a requirement.** Record the open role, number of positions, experience, skills, client, and status. A job description may be attached.
3. **Add or find candidates.** Candidate details and resumes are managed in Candidates. A candidate can be associated with one or more requirements.
4. **Move candidates through the pipeline.** Record status changes, schedule interviews, and capture feedback. The Master Tracker is the broad operational view of candidate-to-requirement progress.
5. **Review activity and outcomes.** Use Dashboard, Summary/Analysis, Daily Tracker, and logs for current work, trends, daily reporting, and troubleshooting.

## 3. Roles and access

The frontend defines three role types. Actual access also depends on the account and backend permissions.

| Role | Typical use |
| --- | --- |
| Superuser (role ID 1) | Administration and operational screens, including user management, settings, and logs. |
| User (role ID 2) | Day-to-day recruiting screens such as candidates, requirements, pipeline, jobs, and email campaigns. |
| Account Manager (role ID 3) | Client and requirement visibility, dashboard and reporting; fewer recruiting operations are exposed. |

The route configuration is the source for the roles allowed to open a page. A hidden or denied page is usually an access/role issue, not missing data.

## 4. Screen-by-screen guide

### Sign in and account access

#### Login (`/login`)

Enter your work email and password to start a session. The app restores the logged-in user state and restricts protected screens based on role. If you cannot sign in, check that you are using the correct account and use the password recovery flow.

#### Forgot password (`/forgot-password`) and recovery (`/recover`)

Forgot Password starts the reset process using the account email. The recovery screen handles the reset link/token flow and lets the user establish a new password. Follow the link from the recovery message while it is valid.

#### Reset password (`/reset` link in the menu)

The navbar offers a Reset Password action. The route configuration currently does not declare `/reset`, so this link may fall through to the default dashboard route in this version. Password recovery screens are declared separately.

### Main navigation and shared layout

Most protected pages share the top navigation bar. It contains the TA Tracker brand/home link, primary product areas, and the user menu. The primary navigation is role-filtered. A responsive/mobile navigation is also present. The older sidebar component in the source is not mounted in the current layout.

The profile menu provides profile editing, invite/user-management links where permitted, password actions, and logout. The profile dialog lets the signed-in user view/edit personal details such as name, email, phone, and profile image.

### Dashboard (`/` and `/dashboard`)

The dashboard is the starting overview. The current dashboard implementation greets the user, shows KPI cards and charts, and has panels for:

- **Requirement Priorities:** requirements needing attention, helping a recruiter decide what to work on.
- **Today’s Interviews:** interview schedule for the day.
- **Previous Interview Feedback:** feedback waiting to be reviewed or tracked.

Charts summarize work by client, week, or recruiter. Account Managers see the requirement priorities panel; other dashboard roles can also see interviews and feedback. Use this screen to orient yourself before opening a specific requirement or candidate.

> The route `/dashboard` currently renders the Home page, while the separate dashboard component is not the one mounted by that route. The Home page includes a greeting, KPI/chart summaries, priorities, interviews, feedback, and recent candidates. Some older dashboard code is present but not active through the current route configuration.

### Requirements (`/requirements`)

This is the register of client hiring requests. The table includes role, client, position count/filled count, location, experience, skills, dates, and status. You can search, filter by client, sort columns, load additional rows, and export the currently loaded records.

From this screen, users with access can:

- Create a requirement, including through the client/requirement stepper.
- Edit requirement details or update its status.
- Attach/view a job description document where one is available.
- Add a candidate against a selected requirement.

Use the client filter and role/skill details to find the right opening. Status values indicate whether a requirement is active, on hold, or closed; exact values are configured by administrators.

### Master Tracker / Candidate Pipeline (`/candidate-pipeline`)

This is the consolidated working view of candidates mapped to requirements. It is designed for searching by candidate name/email, client, or role, filtering the working set, and reviewing candidate status. Status can be edited inline; supporting dialogs handle related operations. The screen also shows aggregate candidate counts per requirement and has export options.

Use it when you need to answer “who is being considered for this opening, and where are they in the process?” Use the candidate profile when you need the detailed record or history.

### Candidates (`/candidates` route; component label “Candidate Management”)

The candidate list is the searchable directory of candidate records. It supports browsing/searching candidate data, opening a candidate’s overview, exporting records, and candidate actions such as archive. The add/edit flows include candidate details and resume handling; some paths use a resume parser to prefill a form for review.

Choose a candidate row/profile to view the person’s details and recruitment history. A candidate can be linked to multiple requirements, so their profile may show more than one application.

### Candidate Overview (`/candidate-profile/:id`)

This detail page shows the candidate identity card (name, contact details, skills, location, experience, notice period, and source) and an application-history panel. The history includes status changes, profile changes, requirement mappings, and related timelines. History can load more records as you scroll. When opened from a requirement context, a `requirementId` query parameter can focus the relevant mapping.

Use this screen to understand an individual’s whole journey and confirm what has changed over time.

### Daily Tracker (`/daily-tracker`)

This is a day-based operational report with three sections/tabs: **Profiles**, **Interviews**, and **Offers**. Choose a date, and (for profile/interview views) optionally filter by TA. The tables track daily counts/lists and editable remarks or challenges; changes save back to the tracker. The page can export the selected day’s report.

Use it for daily team reporting. It is distinct from the Master Tracker: Daily Tracker is organized around a date and daily activity, while Master Tracker is organized around candidate/requirement progress.

### Jobs (`/jobs`) and Job Detail (`/jobs/job-detail/:id`)

Jobs provides a searchable view of job records and a path to add a job. Select a job to open its detail screen, where the job information can be reviewed. This is a separate job-oriented screen from the requirements register; the requirements workflow is the primary place for client hiring requests in the current UI.

### Clients (`/client`)

Client Management lists client accounts and lets permitted users search and maintain client records. Client data is referenced when requirements are created. Related form flows can capture client locations and contacts, and the add-client stepper can continue into requirement creation.

### Designations / Roles (`/role`)

Designation Management maintains the reusable job-title catalog. Search for a designation, add a new one, edit its name/description inline, delete it, or export the list. Designations are reference values used when recording roles and requirements.

### Interview Rounds (`/round`)

This screen manages round/interview records. The list shows round name, feedback, candidate, interview date, position, and whether the round is complete. Users can search and export, add a round, edit it, or delete it. Use it to maintain interview-stage details; candidate scheduling and feedback may also be initiated from candidate or pipeline workflows.

### Summary / Analysis (`/summary`)

Summary is an analytics/reporting workspace. Select a report type, date range, and user filter; search within the displayed results and export the report. Reports aggregate recruiting activity across the selected dimensions. Some analysis categories and how statuses roll up into them are configurable in Settings.

Use this for trend and performance questions, rather than updating an individual candidate’s current status.

### Email Campaigns (`/email-campaigns`)

Email campaigns has three tabs:

- **Templates:** maintain reusable email templates in a library.
- **Send & preview:** choose recipients (candidates, client SPOCs, and/or users), compose or select a template, add interview details where relevant, preview the message, and send it.
- **Activity:** review campaign activity/logs.

Check recipients and preview the content before sending. The screen validates that required recipients and interview details are supplied for the relevant email flow.

### User Management (`/users`)

Superuser-only screen to search, filter, export, and edit user accounts. User records include identity/contact fields, role, and active state. Use it to maintain access for team members; role choice determines which parts of the app they can open.

### Settings (`/settings`)

Superuser-only configuration page with three tabs:

- **Statuses:** create, search, edit, and maintain candidate status values and their categories.
- **Gap analysis mapping:** map statuses/categories to the reporting buckets used by gap analysis. Defaults and database overrides are supported.
- **Tringapps Holidays:** manage company holidays by date/year; holiday data can be added, searched, filtered, edited, and removed.

Status changes affect how recruiting progress is recorded, and gap mappings affect how reports group that progress. Coordinate changes with the team because they can change reporting interpretation.

### Logs (`/logs`)

Searchable activity/technical log viewer. Filter by text, severity/level, user, date range, and sort order. Apply filters, refresh, or reset them. This screen is useful for diagnosing failures or checking recorded activity; it is not a candidate communication timeline.

## 5. Common user tasks

### Create a requirement and track a candidate

1. Open **Clients** and confirm the client exists; add it if needed.
2. Confirm the role exists under **Role**; add it if needed.
3. Open **Requirements**, create the opening, and fill in client, role, position count, experience, skills, dates, and status.
4. Attach the job description if available.
5. Add a candidate from the requirement flow or open **Candidates** to create/import a profile.
6. Use **Master Tracker** to update the candidate’s progress and **Candidate Overview** for history and detail.
7. Record interviews/feedback and review the dashboard or reports as needed.

### Find out what needs attention today

Open **Dashboard** and review Requirement Priorities, Today’s Interviews, and Previous Interview Feedback. Then follow the relevant item into Requirements, Master Tracker, or the candidate profile.

## 6. Notes about navigation in this source version

The route file and navbar contain a few mismatches that can confuse new users:

- The candidate route is declared as `/Candidates` (capital C), but the navbar links to `/candidates` (lowercase). Browser hosting may treat these as different paths.
- The navbar links to `/home` (Profile), `/admin` (Send Invite), and `/reset` (Reset Password), but these paths are not declared in the current route table. They may not open the intended screen in this build.
- `/users`, `/settings`, and `/email-campaigns` are valid declared paths, though only some roles can access them.
- The older customized sidebar lists entries that do not match the active navbar and is commented out of the layout. Follow the active top navbar and route configuration when documenting the current product.
- The route named `/dashboard` currently renders the Home page. A separate dashboard implementation exists in source but is not directly used by that route.

These are observations from the frontend source and may differ from a deployed build if routing or access is adjusted elsewhere.

## 7. A few practical tips for a new team member

- Start from the requirement when you are working on a particular opening; start from the candidate profile when you are investigating one person.
- Update status and interview feedback promptly so dashboards and exports reflect the latest work.
- Check the correct client and requirement before changing a candidate’s status, especially if that candidate is mapped to more than one opening.
- Treat exports and email sends as business records: check the selected filters, recipients, and preview first.
- If a page is missing, verify the spelling/case of its URL and your account role before assuming the feature or data is unavailable.

## 8. What this guide is based on

This guide describes the frontend screens and routes currently defined in this repository. Screen content and access can vary with user role, backend data, feature configuration, and deployed version. Terms like “candidate status” and “requirement status” may be configured by the organization.
