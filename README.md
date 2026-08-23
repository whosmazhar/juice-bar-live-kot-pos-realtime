# Juice Bar — Realtime KOT + POS + MongoDB

## 1. Install
Open Command Prompt in this folder:

```bat
npm install
```

## 2. Configure MongoDB
Copy `.env.example` to `.env` and replace `YOUR_PASSWORD` with your MongoDB Atlas database-user password.

Example:

```env
MONGODB_URI=mongodb+srv://starsingctk_db_user:YOUR_PASSWORD@thejuicebar.lvyl39z.mongodb.net/juicebar?retryWrites=true&w=majority
MONGODB_DB=juicebar
PORT=3000
```

Do not upload `.env` to GitHub.

If the password contains special characters such as `@`, `#`, `/`, `:`, or `%`, URL-encode those characters.

## 3. Start

```bat
npm start
```

Open:

`http://localhost:3000`

## 4. Realtime behavior

The customer and staff clients connect to the same Socket.IO server. KOT status changes are stored in MongoDB and broadcast with `order:update`, so a customer on a different device/network can receive status changes in realtime.

For public mobile-data/Wi-Fi access, deploy this Node.js app to a public host and use HTTPS/WSS.
