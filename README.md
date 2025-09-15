# ETS Ecommerce – Modern E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js\&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb\&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel\&logoColor=white)](https://ets-ecommerce.vercel.app/)

A **modern e-commerce web application** built with **Next.js**, **MongoDB**, and **GridFS**.
Includes a **fully functional admin panel** for managing products, users, admins, and customer messages — designed to be scalable, secure, and user-friendly.

🔗 **Live Demo:** [ets-ecommerce.vercel.app](https://ets-ecommerce.vercel.app/)

---

## 🚀 Features

* 🛒 **E-Commerce Functionality** – Browse, search, and purchase products seamlessly.
* 👤 **User Accounts** – Create and manage accounts for personalized shopping.
* 🔐 **Admin Panel** – Manage products, admins, users, and customer messages.
* 📂 **GridFS Integration** – Efficiently handle product image storage in MongoDB.
* 📦 **Product Management** – Add, edit, and delete products with ease.
* 💬 **Message Management** – Admins can view and manage user-submitted messages.
* 🎨 **Responsive Design** – Optimized for desktop and mobile devices.

---

## 🛠️ Tech Stack

<div align="left">  
  <img src="https://skillicons.dev/icons?i=nextjs,mongodb,typescript,tailwind,vercel,git,github" />  
</div>  

* **Frontend:** Next.js + TailwindCSS
* **Backend:** Next.js API Routes with MongoDB & GridFS
* **Database:** MongoDB (with GridFS for file storage)
* **Deployment:** Vercel

---

## 📂 Project Structure

```
├── components     # Reusable UI components (Navbar, Product Cards, etc.)
├── lib            # Database & GridFS configurations
├── pages          # Next.js pages (shop, product, admin, api routes)
├── public         # Static assets
├── styles         # Global styles
└── utils          # Helper functions
```

---

## 🔧 Getting Started

Follow these steps to run the project locally:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/ets-ecommerce.git
   cd ets-ecommerce
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_secret_key
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. Open your browser at:

   ```
   http://localhost:3000
   ```

---

## 🗺️ Roadmap / Future Improvements

* 🏷️ Product categories & filters
* 💳 Payment gateway integration (Stripe / PayPal)
* 📦 Order management system
* 📊 Admin dashboard analytics
* 🌙 Dark mode toggle
* 
---

## 🤝 Contributing

Contributions are welcome!
If you’d like to improve the UI, add new features, or fix bugs:

1. Fork the repo
2. Create a new branch
3. Make your changes
4. Submit a pull request

