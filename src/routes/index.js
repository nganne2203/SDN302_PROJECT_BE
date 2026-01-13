import express from 'express';

const Router = express.Router();

// Sample route
Router.get('/', (req, res) => {
  res.send('Welcome to the Phone Accessories API');
});

export const ROUTES = Router;