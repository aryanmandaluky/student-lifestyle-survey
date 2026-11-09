const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS = path.join(DATA, 'users');
const ACCOUNTS = path.join(DATA, 'accounts.json');
fs.mkdirSync(USERS, {recursive:true});
if (!fs.existsSync(ACCOUNTS)) fs.writeFileSync(ACCOUNTS, '[]');
app.use(express.json({limit:'20kb'}));
app.use(express.static(path.join(__dirname,'public')));
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
function write(file, obj) { const temp = file+'.tmp'; fs.writeFileSync(temp,JSON.stringify(obj,null,2)); fs.renameSync(temp,file); }
const sessions = new Map();
function auth(req,res,next) { const token=(req.headers.authorization||'').replace(/^Bearer /,''); const id=sessions.get(token); if(!id) return res.status(401).json({error:'Please log in.'}); req.accountId=id; next(); }
function accountFile(id) { return path.join(USERS,`${id}.json`); }
const fields=['major','year','studyPlace','studyHours','goals','clubs'];
app.post('/api/register',(req,res)=>{
  const username=String(req.body.username||'').trim(), password=String(req.body.password||'');
  if(!username||!password) return res.status(400).json({error:'Enter both a username and password.'});
  if(username.length>60||password.length>200) return res.status(400).json({error:'Input is too long.'});
  const accounts=read(ACCOUNTS);
  if(accounts.some(a=>a.username.toLowerCase()===username.toLowerCase())) return res.status(409).json({error:'Username already exists.'});
  const id=crypto.randomUUID();
  const file=`users/${id}.json`;
  // Account list contains username, password verifier, and account file path.
  // Passwords are salted and hashed rather than stored as plaintext.
  const salt=crypto.randomBytes(16).toString('hex');
  const passwordHash=crypto.scryptSync(password,salt,64).toString('hex');
  write(accountFile(id),{id,username,form:null});
  accounts.push({id,username,password:`${salt}:${passwordHash}`,accountFile:file});
  write(ACCOUNTS,accounts);
  res.json({message:'Account created successfully!',id});
});
app.post('/api/login',(req,res)=>{
  const {username,password}=req.body;
  const accounts=read(ACCOUNTS);
  const account=accounts.find(a=>a.username===username);
  if(!account) return res.status(401).json({error:'Incorrect username or password.'});
  const [salt,hash]=account.password.split(':');
  const calculated=crypto.scryptSync(String(password||''),salt,64);
  const expected=Buffer.from(hash,'hex');
  if(calculated.length!==expected.length||!crypto.timingSafeEqual(calculated,expected)) return res.status(401).json({error:'Incorrect username or password.'});
  const token=crypto.randomBytes(32).toString('hex'); sessions.set(token,account.id);
  res.json({token,username:account.username,id:account.id});
});
app.post('/api/logout',auth,(req,res)=>{const token=req.headers.authorization.replace(/^Bearer /,'');sessions.delete(token);res.json({ok:true});});
app.get('/api/me',auth,(req,res)=>{const account=read(accountFile(req.accountId));res.json({id:account.id,username:account.username});});
app.get('/api/form',auth,(req,res)=>{res.json(read(accountFile(req.accountId)).form||{});});
app.post('/api/form',auth,(req,res)=>{
  const form={}; for(const field of fields) form[field]=typeof req.body[field]==='string'?req.body[field].slice(0,2000):'';
  if(!['','Freshman','Sophomore','Junior','Senior','Graduate'].includes(form.year) || !['','Library','Home','Coffee shop','Campus'].includes(form.studyPlace) || !['','0-1','2-3','4-5','6+'].includes(form.studyHours)) return res.status(400).json({error:'Invalid survey selection.'});
  const account=read(accountFile(req.accountId));account.form=form;write(accountFile(req.accountId),account);res.json({message:'Survey saved successfully!'});
});
app.get('/api/records',auth,(req,res)=>{
  const accounts=read(ACCOUNTS);
  res.json(accounts.map(a=>({id:a.id,form:read(accountFile(a.id)).form})));
});
app.listen(PORT,()=>console.log(`Website running at http://localhost:${PORT}`));
