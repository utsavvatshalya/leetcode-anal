# Deploying LeetCode Pattern Analyzer on Vercel

This full-stack application utilizes a React + Vite frontend and a custom Node.js Express server backend (`server.ts`). 

To make this app seamlessly deployable on Vercel's serverless environment, we've predefined:
- `vercel.json` routing rules to map all `/api/*` server routes to a serverless function structure.
- `api/index.ts` handler that exports your Express instance as a serverless microservice.
- Conditional environment guards in `server.ts` to disable background polling/listening scripts when hosted inside ephemeral serverless containers.

---

## Step-by-Step Vercel Deployment

There are two primary ways to deploy your application to Vercel:

### Option A: Direct Vercel Git Integration (Recommended)
1. **Push your code to GitHub (or GitLab/Bitbucket).**
2. **Sign in to [Vercel](https://vercel.com/)** and click the **"Add New" -> "Project"** button.
3. Import your repository from Git.
4. Keep the default settings (Vercel automatically detects the Vite configuration).
5. Open **"Environment Variables"** under settings, and add:
   - `GEMINI_API_KEY`: Your Gemini API secure server key (this is kept private on the server and is never exposed to the client browser).
6. Click **Deploy**. Vercel will build the frontend assets, bundle the api functions, and launch your live deployment link.

### Option B: Deploying via Vercel CLI
If you prefer terminal-based commands:
1. Install Vercel globally:
   ```bash
   npm install -g vercel
   ```
2. Log in and initiate deployment from your directory root:
   ```bash
   vercel login
   vercel
   ```
3. Set your environment values when prompted or within your online Vercel project panel.

---

## Technical Concept: Persistent Serverless Storage Note

- This app utilizes an offline database structure (`database.json`) inside Express during development. 
- Because Vercel serverless functions run on **ephemeral (temporary) read-only containers**, local file writes via `fs.writeFileSync` do not persist across multiple user sessions or serverless wake-up cycles.
- **For Production Scaling**: If you are launching this for a large user base or production portfolio, we recommend changing the `getDb()` and `saveDb()` helper methods inside `server.ts` to persist states in a durable cloud database (such as **Firebase Firestore**, which is fully supported and can be provisioned using our Firebase integration tool, or other managed Postgres databases).
