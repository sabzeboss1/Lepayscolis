# Le Pays Express Colis - Backend API

Laravel 11 REST API backend for Le Pays Express Colis, a peer-to-peer platform connecting travelers who can transport packages with senders who need to ship items internationally.

## Technology Stack

- **Framework**: Laravel 11.x
- **PHP**: 8.2+
- **Database**: MySQL 8.0+ / PostgreSQL 14+
- **Cache & Queues**: Redis
- **Authentication**: Laravel Sanctum
- **File Storage**: AWS S3
- **Payments**: Stripe (PaymentIntent + Connect)
- **Real-time**: Pusher (WebSocket)
- **Testing**: PHPUnit + Eris (Property-Based Testing)

## Key Features

- 🔐 **Authentication**: Secure token-based API authentication with Laravel Sanctum
- ✅ **KYC Verification**: Identity verification system with document upload
- 🚗 **Trip Management**: Travelers can publish trips with available capacity
- 📦 **Shipment Tracking**: Senders can create and track package deliveries
- 💬 **Real-time Messaging**: WebSocket-based messaging between users
- ⭐ **Rating System**: User reputation and feedback management
- 💳 **Escrow Payments**: Secure payment processing with Stripe
- 📧 **Multi-channel Notifications**: Email, push, and WebSocket notifications

## Property-Based Testing

This project uses **Eris** for property-based testing, providing comprehensive test coverage through automatic test case generation. The project includes **112 properties** that validate universal rules across all features.

### Running Property Tests

```bash
# Run all tests (including property tests)
php artisan test

# Run only property-based tests
php artisan test --filter=PropertyBased

# Run verification tests
php artisan test --filter=ErisVerificationTest
```

### Documentation

- [Property-Based Testing Guide](docs/PROPERTY_BASED_TESTING_GUIDE.md) - Complete guide to using Eris
- [Task 1.5 Completion](docs/TASK_1.5_COMPLETION.md) - Installation verification

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   composer install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
4. Generate application key:
   ```bash
   php artisan key:generate
   ```
5. Configure your database and services in `.env`
6. Run migrations:
   ```bash
   php artisan migrate
   ```
7. Run tests:
   ```bash
   php artisan test
   ```

## Development

```bash
# Start development server
php artisan serve

# Run queue worker
php artisan queue:work

# Watch logs
php artisan pail
```

## Documentation

- [Requirements Document](.kiro/specs/lepaysexpresscolis-backend/requirements.md)
- [Design Document](.kiro/specs/lepaysexpresscolis-backend/design.md)
- [Implementation Tasks](.kiro/specs/lepaysexpresscolis-backend/tasks.md)
- [Stripe Setup](docs/STRIPE_SETUP.md)
- [AWS S3 Setup](docs/AWS_S3_SETUP.md)
- [Pusher Setup](docs/PUSHER_SETUP.md)

---

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com/)**
- **[Tighten Co.](https://tighten.co)**
- **[WebReinvent](https://webreinvent.com/)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel/)**
- **[Cyber-Duck](https://cyber-duck.co.uk)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Jump24](https://jump24.co.uk)**
- **[Redberry](https://redberry.international/laravel/)**
- **[Active Logic](https://activelogic.com)**
- **[byte5](https://byte5.de)**
- **[OP.GG](https://op.gg)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
