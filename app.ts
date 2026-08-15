import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { supabase } from './supabase';
import { AuthTokenResponsePassword } from '@supabase/supabase-js';
dotenv.config();

const app = express();
app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log("Server is running on port 3000 and connected to Supabase");
});

app.post('/auth/signup', async (req: Request, res: Response, next) => {

  const { email, password } = req.body;
  console.log(req.body)
  if (!email ||!password) {
     res.status(400).json({ error: 'Email and password are required' });
     return;
  }

  const signUp = await supabase.auth.signUp({ email, password });
  if (signUp.error) {
    return next(signUp.error);
  }
  res.status(201).send();
  return;
});

app.post('/auth/login', async (req: Request, res: Response, next) => {
  const { email, password } = req.body;
  if (!password || !email) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }
  const login: AuthTokenResponsePassword = await supabase.auth.signInWithPassword({ email, password })

  if (login.error) {
    return next(login.error);
  }
  if(login){
    res.status(200).json({ message: 'Login successful', jwt: login.data.session?.access_token});
  }else{
    res.status(401).json({ error: 'Invalid credentials'});
  }

});

app.use((err: Error, req: Request, res: Response) => {
  console.error(err.message);
  res.status(500).send()
  return
});
