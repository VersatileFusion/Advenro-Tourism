# Advenro Travel Platform

A comprehensive travel booking platform with features for hotels, flights, tours, restaurants, and user management.

## Features

- **User Authentication**: Login, registration, and profile management
- **Booking System**: Book hotels, flights, tours, and restaurants
- **Search Functionality**: Unified search across all travel services
- **Admin Dashboard**: Complete administrative interface
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Notifications**: WebSocket-based notifications

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/advenro.git
cd advenro
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory based on the `.env.example` file.

4. Start the application:
```bash
npm run dev
```

## Usage

- Access the main application at http://localhost:3000
- Access the admin dashboard at http://localhost:3000/admin

## API Testing

You can test the API endpoints using the included Postman collection:
```bash
# Import the following files into Postman
postman_collection.json
postman_environments.json
```

## Mock Server

For development without external dependencies, use the mock server:
```bash
node mock-server.js
```

## Deployment

For detailed deployment instructions, refer to:
- `DEPLOYMENT-GUIDE.md` - General deployment guide
- `DOCKER-DEPLOYMENT.md` - Docker-specific deployment instructions

## Technologies

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time**: WebSockets
- **Authentication**: JWT
- **API Documentation**: Swagger
- **Payment Processing**: Stripe

## Project Structure

- `/app`: Backend code
  - `/controllers`: API controllers
  - `/middleware`: Express middleware
  - `/models`: Database models
  - `/routes`: API routes
  - `/services`: Business logic
  - `/config`: Configuration files
  - `/websocket`: WebSocket functionality
- `/public`: Frontend code
  - `/css`: Stylesheets
  - `/js`: JavaScript files
  - `/images`: Images and assets
- `/docs`: Documentation
- `/test`: Test files
- `/mock-data`: Mock data for development

## Contributing

Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

For more detailed testing information, see `README-TESTING.md`.

## Troubleshooting

For common issues and their solutions, see `TROUBLESHOOTING.md`.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

<div dir="rtl">

# پلتفرم سفر ادونرو

یک پلتفرم جامع رزرو سفر با امکاناتی برای هتل‌ها، پروازها، تورها، رستوران‌ها و مدیریت کاربران.

## ویژگی‌ها

- **احراز هویت کاربر**: ورود، ثبت‌نام و مدیریت پروفایل
- **سیستم رزرو**: رزرو هتل‌ها، پروازها، تورها و رستوران‌ها
- **قابلیت جستجو**: جستجوی یکپارچه در تمام خدمات سفر
- **داشبورد مدیریت**: رابط کامل مدیریتی
- **طراحی واکنش‌گرا**: بهینه‌سازی شده برای دسکتاپ و دستگاه‌های موبایل
- **اعلان‌های بلادرنگ**: اعلان‌های مبتنی بر WebSocket

## نصب

1. مخزن را کلون کنید:
```bash
git clone https://github.com/yourusername/advenro.git
cd advenro
```

2. وابستگی‌ها را نصب کنید:
```bash
npm install
```

3. متغیرهای محیطی را پیکربندی کنید:
یک فایل `.env` در دایرکتوری اصلی بر اساس فایل `.env.example` ایجاد کنید.

4. برنامه را شروع کنید:
```bash
npm run dev
```

## استفاده

- به برنامه اصلی در http://localhost:3000 دسترسی پیدا کنید
- به داشبورد مدیریت در http://localhost:3000/admin دسترسی پیدا کنید

## تست API

شما می‌توانید نقاط پایانی API را با استفاده از مجموعه Postman موجود تست کنید:
```bash
# فایل‌های زیر را به Postman وارد کنید
postman_collection.json
postman_environments.json
```

## سرور شبیه‌سازی شده

برای توسعه بدون وابستگی‌های خارجی، از سرور شبیه‌سازی شده استفاده کنید:
```bash
node mock-server.js
```

## استقرار

برای دستورالعمل‌های دقیق استقرار، به موارد زیر مراجعه کنید:
- `DEPLOYMENT-GUIDE.md` - راهنمای کلی استقرار
- `DOCKER-DEPLOYMENT.md` - دستورالعمل‌های استقرار مختص Docker

## فناوری‌ها

- **فرانت‌اند**: HTML، CSS، JavaScript
- **بک‌اند**: Node.js، Express.js
- **پایگاه داده**: MongoDB
- **بلادرنگ**: WebSockets
- **احراز هویت**: JWT
- **مستندات API**: Swagger
- **پردازش پرداخت**: Stripe

## ساختار پروژه

- `/app`: کد بک‌اند
  - `/controllers`: کنترلرهای API
  - `/middleware`: میدلویرهای Express
  - `/models`: مدل‌های پایگاه داده
  - `/routes`: مسیرهای API
  - `/services`: منطق کسب و کار
  - `/config`: فایل‌های پیکربندی
  - `/websocket`: قابلیت WebSocket
- `/public`: کد فرانت‌اند
  - `/css`: استایل‌شیت‌ها
  - `/js`: فایل‌های JavaScript
  - `/images`: تصاویر و دارایی‌ها
- `/docs`: مستندات
- `/test`: فایل‌های تست
- `/mock-data`: داده‌های شبیه‌سازی شده برای توسعه

## مشارکت

لطفاً `CONTRIBUTING.md` را برای جزئیات مربوط به آیین‌نامه رفتاری ما و فرآیند ارسال درخواست‌های pull مطالعه کنید.

## تست

```bash
# اجرای همه تست‌ها
npm test

# اجرای تست‌های واحد
npm run test:unit

# اجرای تست‌های یکپارچگی
npm run test:integration

# اجرای تست‌های E2E
npm run test:e2e
```

برای اطلاعات دقیق‌تر تست، به `README-TESTING.md` مراجعه کنید.

## عیب‌یابی

برای مشکلات رایج و راه‌حل‌های آن‌ها، به `TROUBLESHOOTING.md` مراجعه کنید.

## مجوز

این پروژه تحت مجوز ISC است - برای جزئیات به فایل LICENSE مراجعه کنید.

</div> 