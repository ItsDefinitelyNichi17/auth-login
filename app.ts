import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { supabase } from './supabase';
import { AuthTokenResponsePassword } from '@supabase/supabase-js';
import e from 'express';
dotenv.config();

interface AuthRequest extends Request {
  token?: string | undefined;
  data?: {
    id: string;
    email: string | undefined;
    account_created: string;
  };
}

const app = express();
app.use(express.json());

app.post('/auth/signup', async (req: Request, res: Response, next) => {

  const { email, password } = req.body;

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

app.get('/public/info',(req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome Stranger, this is public info' });
});

app.get('/protected/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.status(200).json({ data: req.data });
});

app.post('/auth/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const logout = await supabase.auth.admin.signOut(req.token);
  res.status(204).json({ message: 'Logout successful' });
  return;
});

app.get('/protected/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.status(200).send()
  return
});
app.use((err: Error, req: Request, res: Response) => {
  res.status(500).send(err)
  return
});

app.listen(process.env.PORT, () => {
    console.log("Server is running on port 3000 and connected to Supabase");
});


//Middlewares
async function authMiddleware(req: AuthRequest, res: Response, next: () => void) {
  const getToken = req.header('Authorization') as string;
  if (getToken.split(' ')[0] !== 'Bearer' || !getToken || getToken.length === 0 || typeof getToken !== 'string') {
    return res.status(401).json({ error: 'Header is missing or has invalid Authorizantio Scheme' });
  }

  const token = getToken.split(' ')[1];
  if ( token.split('.').length !==3) {
    return res.status(401).json({ error: 'Authorization header is missing or malformed' });
  }

  const validate = await supabase.auth.getUser(token);
  if (validate.error) {
    console.log(validate.error)
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.token = token;
  req.data ={
    id: validate.data.user.id,
    email: validate.data.user.email,
    account_created: validate.data.user.created_at,
  }

  next();
}
