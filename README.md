# Slice - Pizza Delivery App

A full-stack pizza ordering and inventory management app that I built with the MERN stack. Customers can order ready-made pizzas or build their own, pay with Razorpay and track the order live. The admin manages orders and stock from a separate panel.

## Tech Stack

- **Frontend:** React (Vite), React Router, Framer Motion
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **Payments:** Razorpay (test mode)
- **Real-time:** Socket.IO
- **Emails:** Nodemailer / Brevo
- **Scheduled jobs:** node-cron

## Features

### User
- Register with email verification
- Login with JWT authentication
- Forgot password (reset link sent by email)
- Dashboard with all pizza varieties
- Custom pizza builder: base (5 options), sauce (5 options), cheese, and vegetables (multiple select)
- Order summary page before payment
- Razorpay checkout (test mode)
- Live order status: Order Received, In Kitchen, Sent to Delivery

### Admin
- Separate admin login (admins cannot be created from the signup page)
- Inventory dashboard for bases, sauces, cheeses and vegetables
- Stock goes down automatically after every paid order
- Manual stock update for each item
- Email alert when an item falls below its threshold (checked by a node-cron job)
- Order management panel to update order status
- Status changes show up on the user's dashboard in real time

## Project Structure

```
pizza-app/
├── backend/     Express API, models, routes, cron job, seed data
└── frontend/    React app
``

## Author

Dinesh


Live Demo

🚀 Visit the deployed application:
https://slice-pizza-website.vercel.app/

GitHub Repository:
https://github.com/gudipati-dinesh/OIBSIP_WebDevelopment_Task1
