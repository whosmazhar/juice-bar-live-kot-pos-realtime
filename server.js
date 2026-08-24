require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "juicebar";
const COLLECTION_NAME = "orders";
const OWNER_USERNAME = (process.env.OWNER_USERNAME || "owner").toLowerCase();
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "changeme123";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

function hashPassword(password, salt){
  salt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, hash){
  const check = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const a = Buffer.from(check, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// In-memory session tokens: token -> { username, name, role }.
// Simple and fine for a small internal tool — tokens live only as long
// as the server process runs, so everyone re-logs-in after a redeploy.
const sessions = new Map();

function makeSession(user){
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { username: user.username, name: user.name, role: user.role });
  return token;
}

function publicUser(u){
  return { username: u.username, name: u.name, role: u.role };
}

<<<<<<< HEAD
function normalizePhone(phone){
  return String(phone || "").replace(/[^0-9+]/g, "").trim();
}

function computeDiscountAmount(subtotal, discountType, discountValue){
  subtotal = Number(subtotal) || 0;
  discountValue = Number(discountValue) || 0;
  let amount = 0;
  if(discountType === "percent"){
    amount = subtotal * Math.min(Math.max(discountValue, 0), 100) / 100;
  }else if(discountType === "amount"){
    amount = Math.min(Math.max(discountValue, 0), subtotal);
  }
  return Math.round(amount * 100) / 100;
}

function publicMember(m){
  return { phone: m.phone, name: m.name, discountType: m.discountType, discountValue: m.discountValue };
}

=======
>>>>>>> 4810a1d68b275a3ed425dfec904aeb63e7ce2765
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let db;
let ordersCollection;
let menuCollection;
let staffCollection;
<<<<<<< HEAD
let membersCollection;
=======
>>>>>>> 4810a1d68b275a3ed425dfec904aeb63e7ce2765

async function getMenu(){
  const doc = await menuCollection.findOne({ _id: "current" });
  return doc && Array.isArray(doc.items) ? doc.items : [];
}

async function saveMenu(items){
  await menuCollection.replaceOne(
    { _id: "current" },
    { _id: "current", items: Array.isArray(items) ? items : [], updatedAt: Date.now() },
    { upsert: true }
  );
}

function sanitizeOrder(order){
  if(!order || typeof order !== "object") return null;
<<<<<<< HEAD
  const items = Array.isArray(order.items) ? order.items : [];
  // subtotal is the pre-discount cart total. Older clients / records only
  // ever sent "total", so fall back to that when subtotal is missing.
  const subtotal = Number(order.subtotal != null ? order.subtotal : (order.total || 0));
  const discountType = ["percent","amount"].includes(order.discountType) ? order.discountType : "";
  const discountValue = discountType ? Math.max(0, Number(order.discountValue || 0)) : 0;
  const discountAmount = discountType ? computeDiscountAmount(subtotal, discountType, discountValue) : 0;
  const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  return {
    id: String(order.id || ""),
    items,
    notes: String(order.notes || ""),
    customerName: String(order.customerName || ""),
    customerPhone: normalizePhone(order.customerPhone || ""),
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    total,
=======
  return {
    id: String(order.id || ""),
    items: Array.isArray(order.items) ? order.items : [],
    notes: String(order.notes || ""),
    customerName: String(order.customerName || ""),
    total: Number(order.total || 0),
>>>>>>> 4810a1d68b275a3ed425dfec904aeb63e7ce2765
    status: ["pending","preparing","ready","completed","cancelled"].includes(order.status) ? order.status : "pending",
    createdAt: Number(order.createdAt || Date.now()),
    paymentStatus: order.paymentStatus === "paid" ? "paid" : "unpaid",
    paymentMethod: order.paymentMethod ? String(order.paymentMethod) : "",
    paidAt: Number(order.paidAt || 0)
  };
}

async function getAllOrders(){
  return ordersCollection.find({}).sort({ createdAt: 1 }).toArray();
}

async function getOrder(id){
  return ordersCollection.findOne({ id: String(id) });
}

async function saveOrder(order){
  await ordersCollection.replaceOne({ id: order.id }, order, { upsert: true });
}

async function start(){
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  ordersCollection = db.collection(COLLECTION_NAME);
  await ordersCollection.createIndex({ id: 1 }, { unique: true });
  await ordersCollection.createIndex({ createdAt: -1 });
  menuCollection = db.collection("menu");
  staffCollection = db.collection("staff");
  await staffCollection.createIndex({ username: 1 }, { unique: true });
<<<<<<< HEAD
  membersCollection = db.collection("members");
  await membersCollection.createIndex({ phone: 1 }, { unique: true });
=======
>>>>>>> 4810a1d68b275a3ed425dfec904aeb63e7ce2765

  const ownerExists = await staffCollection.findOne({ role: "owner" });
  if(!ownerExists){
    const { salt, hash } = hashPassword(OWNER_PASSWORD);
    await staffCollection.insertOne({
      username: OWNER_USERNAME,
      name: "Owner",
      role: "owner",
      salt, hash,
      createdAt: Date.now()
    });
    console.log(`Seeded owner account "${OWNER_USERNAME}" — change this password after logging in.`);
  }

  app.get("/api/health", async (req,res)=>{
    res.json({ ok:true, realtime:true, database:"mongodb", orders:await ordersCollection.countDocuments() });
  });

  app.get("/api/orders", async (req,res)=>{
    try { res.json(await getAllOrders()); }
    catch(err){ console.error(err); res.status(500).json({error:"Database error"}); }
  });

  app.get("/api/orders/:id", async (req,res)=>{
    try{
      const order = await getOrder(req.params.id);
      if(!order) return res.status(404).json({error:"Order not found"});
      res.json(order);
    }catch(err){ console.error(err); res.status(500).json({error:"Database error"}); }
  });

  app.post("/api/orders", async (req,res)=>{
    try{
      const order = sanitizeOrder(req.body);
      if(!order || !order.id) return res.status(400).json({error:"Invalid order"});
      await saveOrder(order);
      io.emit("order:update", order);
      io.emit("orders:updated", await getAllOrders());
      res.json({ok:true,order});
    }catch(err){ console.error(err); res.status(500).json({error:"Database error"}); }
  });

  app.get("/api/menu", async (req,res)=>{
    try { res.json(await getMenu()); }
    catch(err){ console.error(err); res.status(500).json({error:"Database error"}); }
  });

  app.post("/api/menu", async (req,res)=>{
    try{
      const items = Array.isArray(req.body) ? req.body : req.body.items;
      if(!Array.isArray(items)) return res.status(400).json({error:"Invalid menu"});
      await saveMenu(items);
      io.emit("menu:snapshot", items);
      res.json({ok:true});
    }catch(err){ console.error(err); res.status(500).json({error:"Database error"}); }
  });

  io.on("connection", async (socket)=>{
    try{
      socket.emit("orders:snapshot", await getAllOrders());
    }catch(err){ console.error(err); }

    try{
      socket.emit("menu:snapshot", await getMenu());
    }catch(err){ console.error(err); }

    socket.on("menu:request", async ()=>{
      try { socket.emit("menu:snapshot", await getMenu()); }
      catch(err){ console.error(err); }
    });

    socket.on("menu:update", async (items)=>{
      try{
        if(!Array.isArray(items)) return;
        await saveMenu(items);
        io.emit("menu:snapshot", items);
      }catch(err){ console.error("menu:update",err); }
    });

    socket.on("staff:login", async ({username,password}={}, ack)=>{
      try{
        if(!username || !password){ if(ack) ack({ok:false,error:"Missing username or password"}); return; }
        const user = await staffCollection.findOne({ username: String(username).toLowerCase().trim() });
        if(!user || !verifyPassword(password, user.salt, user.hash)){
          if(ack) ack({ok:false,error:"Incorrect username or password"});
          return;
        }
        const token = makeSession(user);
        if(ack) ack({ok:true, token, user: publicUser(user)});
      }catch(err){ console.error("staff:login",err); if(ack) ack({ok:false,error:"Server error"}); }
    });

    socket.on("staff:whoami", async ({token}={}, ack)=>{
      const session = sessions.get(token);
      if(ack) ack(session ? {ok:true, user: session} : {ok:false});
    });

    socket.on("staff:logout", ({token}={}, ack)=>{
      sessions.delete(token);
      if(ack) ack({ok:true});
    });

    socket.on("staff:list", async ({token}={}, ack)=>{
      const session = sessions.get(token);
      if(!session || session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      try{
        const users = await staffCollection.find({}).project({ salt:0, hash:0 }).toArray();
        if(ack) ack({ok:true, users});
      }catch(err){ console.error("staff:list",err); if(ack) ack({ok:false,error:"Server error"}); }
    });

    socket.on("staff:create", async ({token, name, username, password, role}={}, ack)=>{
      const session = sessions.get(token);
      if(!session || session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      try{
        username = String(username||"").toLowerCase().trim();
        if(!username || !password || password.length<4){
          if(ack) ack({ok:false,error:"Username and a password of at least 4 characters are required"});
          return;
        }
        const finalRole = role==="owner" ? "owner" : "staff";
        const { salt, hash } = hashPassword(password);
        await staffCollection.insertOne({
          username, name: String(name||username), role: finalRole, salt, hash, createdAt: Date.now()
        });
        if(ack) ack({ok:true});
      }catch(err){
        if(err && err.code===11000){ if(ack) ack({ok:false,error:"That username already exists"}); return; }
        console.error("staff:create",err);
        if(ack) ack({ok:false,error:"Server error"});
      }
    });

    socket.on("staff:changePassword", async ({token, targetUsername, newPassword}={}, ack)=>{
      const session = sessions.get(token);
      if(!session){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      targetUsername = String(targetUsername||"").toLowerCase().trim();
      const isSelf = targetUsername === session.username;
      if(!isSelf && session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      if(!newPassword || newPassword.length<4){ if(ack) ack({ok:false,error:"Password must be at least 4 characters"}); return; }
      try{
        const { salt, hash } = hashPassword(newPassword);
        const result = await staffCollection.updateOne({ username: targetUsername }, { $set: { salt, hash } });
        if(result.matchedCount===0){ if(ack) ack({ok:false,error:"User not found"}); return; }
        if(ack) ack({ok:true});
      }catch(err){ console.error("staff:changePassword",err); if(ack) ack({ok:false,error:"Server error"}); }
    });

    socket.on("staff:delete", async ({token, targetUsername}={}, ack)=>{
      const session = sessions.get(token);
      if(!session || session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      targetUsername = String(targetUsername||"").toLowerCase().trim();
      if(targetUsername === session.username){ if(ack) ack({ok:false,error:"You can't delete your own account while logged in as it"}); return; }
      try{
        const result = await staffCollection.deleteOne({ username: targetUsername });
        if(ack) ack({ok: result.deletedCount>0});
      }catch(err){ console.error("staff:delete",err); if(ack) ack({ok:false,error:"Server error"}); }
    });

<<<<<<< HEAD
    // Any connected client (customer or staff) can look up a phone number
    // at checkout to see if it belongs to a registered member and what
    // discount they get. Only name/discount info is returned, nothing else.
    socket.on("member:lookup", async ({phone}={}, ack)=>{
      try{
        const p = normalizePhone(phone);
        if(!p){ if(ack) ack({ok:false}); return; }
        const member = await membersCollection.findOne({ phone: p });
        if(ack) ack(member ? { ok:true, member: publicMember(member) } : { ok:false });
      }catch(err){ console.error("member:lookup",err); if(ack) ack({ok:false}); }
    });

    socket.on("member:list", async ({token}={}, ack)=>{
      const session = sessions.get(token);
      if(!session || session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      try{
        const members = await membersCollection.find({}).sort({ createdAt: -1 }).toArray();
        if(ack) ack({ ok:true, members: members.map(publicMember) });
      }catch(err){ console.error("member:list",err); if(ack) ack({ok:false,error:"Server error"}); }
    });

    socket.on("member:create", async ({token, phone, name, discountType, discountValue}={}, ack)=>{
      const session = sessions.get(token);
      if(!session || session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      try{
        const p = normalizePhone(phone);
        if(!p){ if(ack) ack({ok:false,error:"A valid phone number is required"}); return; }
        if(!["percent","amount"].includes(discountType)){ if(ack) ack({ok:false,error:"Choose a discount type"}); return; }
        let dv = Number(discountValue);
        if(!Number.isFinite(dv) || dv<0){ if(ack) ack({ok:false,error:"Enter a valid discount value"}); return; }
        if(discountType==="percent") dv = Math.min(dv,100);
        await membersCollection.insertOne({
          phone: p, name: String(name||"").trim(), discountType, discountValue: dv, createdAt: Date.now()
        });
        if(ack) ack({ok:true});
      }catch(err){
        if(err && err.code===11000){ if(ack) ack({ok:false,error:"A member with this phone number already exists"}); return; }
        console.error("member:create",err);
        if(ack) ack({ok:false,error:"Server error"});
      }
    });

    socket.on("member:update", async ({token, phone, name, discountType, discountValue}={}, ack)=>{
      const session = sessions.get(token);
      if(!session || session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      try{
        const p = normalizePhone(phone);
        if(!p){ if(ack) ack({ok:false,error:"Invalid phone number"}); return; }
        if(!["percent","amount"].includes(discountType)){ if(ack) ack({ok:false,error:"Choose a discount type"}); return; }
        let dv = Number(discountValue);
        if(!Number.isFinite(dv) || dv<0){ if(ack) ack({ok:false,error:"Enter a valid discount value"}); return; }
        if(discountType==="percent") dv = Math.min(dv,100);
        const result = await membersCollection.updateOne(
          { phone: p },
          { $set: { name: String(name||"").trim(), discountType, discountValue: dv, updatedAt: Date.now() } }
        );
        if(result.matchedCount===0){ if(ack) ack({ok:false,error:"Member not found"}); return; }
        if(ack) ack({ok:true});
      }catch(err){ console.error("member:update",err); if(ack) ack({ok:false,error:"Server error"}); }
    });

    socket.on("member:delete", async ({token, phone}={}, ack)=>{
      const session = sessions.get(token);
      if(!session || session.role!=="owner"){ if(ack) ack({ok:false,error:"Not authorized"}); return; }
      try{
        const p = normalizePhone(phone);
        const result = await membersCollection.deleteOne({ phone: p });
        if(ack) ack({ ok: result.deletedCount>0 });
      }catch(err){ console.error("member:delete",err); if(ack) ack({ok:false,error:"Server error"}); }
    });

=======
>>>>>>> 4810a1d68b275a3ed425dfec904aeb63e7ce2765
    socket.on("orders:request", async ()=>{
      try { socket.emit("orders:snapshot", await getAllOrders()); }
      catch(err){ console.error(err); }
    });

    socket.on("order:create", async (raw,ack)=>{
      try{
        const order = sanitizeOrder(raw);
        if(!order || !order.id){
          if(ack) ack({ok:false,error:"Invalid order"});
          return;
        }
        await saveOrder(order);
        io.emit("order:update", order);
        io.emit("orders:updated", await getAllOrders());
        if(ack) ack({ok:true,order});
      }catch(err){
        console.error("order:create",err);
        if(ack) ack({ok:false,error:"Database error"});
      }
    });

    socket.on("order:status", async ({id,status}={})=>{
      try{
        const allowed = ["pending","preparing","ready","completed","cancelled"];
        if(!id || !allowed.includes(status)) return;
        const order = await getOrder(id);
        if(!order) return;
        order.status = status;
        await saveOrder(order);
        // This is the realtime event the customer's phone listens for.
        io.emit("order:update", order);
        io.emit("orders:updated", await getAllOrders());
      }catch(err){ console.error("order:status",err); }
    });

    socket.on("order:payment", async ({id,method}={})=>{
      try{
        if(!id || !method) return;
        const order = await getOrder(id);
        if(!order) return;
        order.paymentStatus = "paid";
        order.paymentMethod = String(method);
        order.paidAt = Date.now();
        await saveOrder(order);
        io.emit("order:update", order);
        io.emit("orders:updated", await getAllOrders());
      }catch(err){ console.error("order:payment",err); }
    });
  });

  server.listen(PORT,"0.0.0.0",()=>{
    console.log(`Juice Bar KOT/POS realtime server listening on port ${PORT}`);
    console.log(`MongoDB database: ${DB_NAME}`);
  });
}

start().catch(err=>{
  console.error("Could not start Juice Bar server:", err.message);
  process.exit(1);
});
