# Splitmate 

A modern expense sharing application built with Django REST Framework and React. This project helps users manage and split expenses within groups, featuring a robust API backend and a responsive frontend.

## Overview

Splitmate is a full-stack web application that simplifies expense sharing among friends, roommates, or any group of people. It provides an intuitive interface for tracking shared expenses and calculating who owes what to whom, with real-time updates and secure authentication.

## Features

- **User Management**
  - JWT-based authentication
  - Secure user registration and login
  - Profile customization with profile pictures
  - Password reset functionality
  - Email verification

- **Group Management**
  - Create and manage multiple expense groups
  - Add/remove group members
  - Set group preferences and rules
  - Group activity feed
  - External member support

- **Expense Tracking**
  - Add expenses with different splitting options:
    - Split equally among all members
    - Split by exact amounts
    - Split by percentage
  - Add expense categories and tags
  - Upload expense receipts
  - Add expense notes and comments
  - Real-time expense updates

- **Balance Management**
  - Real-time balance tracking
  - Settlement suggestions
  - Payment history
  - Export balance reports
  - Automated settlement calculations

- **Statistics and Reports**
  - Expense analytics and visualizations
  - Monthly/yearly expense summaries
  - Category-wise expense breakdown
  - Export reports in various formats

## Technical Stack

### Backend
- Django 5.2
- Django REST Framework
- JWT Authentication
- Python 3.11+
- Celery for async tasks
- PostgreSQL (production-ready)

### Frontend
- React 19
- React Router 6
- Bootstrap 5
- Axios for API calls
- Chart.js for visualizations
- Font Awesome 6

### Additional Tools
- Pillow for image processing
- WhiteNoise for static files
- Django Debug Toolbar
- Coverage.py for testing
- CORS headers for cross-origin requests

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn
- PostgreSQL (for production)
- Git

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd splitmate_project
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/MacOS
   python -m venv venv
   source venv/bin/activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   # Create a .env file in the project root
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. The frontend will be available at http://localhost:3000

### Production Setup

1. Set up a production database (PostgreSQL recommended)
2. Configure environment variables for production
3. Set up a web server (Nginx/Apache)
4. Configure SSL certificates
5. Set up static file serving
6. Configure email backend
7. Build the frontend:
   ```bash
   cd frontend
   npm run build
   # or
   yarn build
   ```

## API Documentation

The API is RESTful and uses JWT for authentication. Key endpoints include:

- `/api/token/` - Obtain JWT tokens
- `/api/token/refresh/` - Refresh JWT tokens
- `/api/register/` - User registration
- `/api/groups/` - Group management
- `/api/expenses/` - Expense management
- `/api/settlements/` - Settlement management

For detailed API documentation, visit `/api/docs/` when running the server.

## Project Structure

```
splitmate_project/
├── expenses/                 # Backend app directory
│   ├── models.py            # Database models
│   ├── views.py             # View logic
│   ├── api_views.py         # API endpoints
│   ├── serializers.py       # API serializers
│   ├── urls.py              # URL routing
│   └── tests.py             # Test cases
├── frontend/                # React frontend
│   ├── src/                # Source files
│   ├── public/             # Static files
│   └── package.json        # Dependencies
├── splitmate_project/      # Project settings
│   ├── settings.py         # Django settings
│   ├── urls.py             # Main URL config
│   └── wsgi.py            # WSGI config
├── static/                 # Static files
├── media/                  # User uploaded files
├── manage.py              # Django management script
└── requirements.txt       # Python dependencies
```

## Development Guidelines

### Code Style
- Backend: Follow PEP 8 guidelines
- Frontend: Follow ESLint configuration
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions small and focused

### Testing
- Write unit tests for both backend and frontend
- Maintain test coverage above 80%
- Run tests before committing:
  ```bash
  # Backend tests
  python manage.py test

  # Frontend tests
  cd frontend
  npm test
  ```

### Git Workflow
1. Create a new branch for each feature
2. Write clear commit messages
3. Create pull requests for code review
4. Ensure CI checks pass before merging

## Troubleshooting

### Common Issues

1. **JWT Token Issues**
   - Check token expiration
   - Verify token refresh logic
   - Ensure proper CORS configuration

2. **Database Migration Errors**
   ```bash
   python manage.py makemigrations
   python manage.py migrate --run-syncdb
   ```

3. **Frontend Build Issues**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

4. **Environment Variables**
   - Ensure all required variables are set in .env
   - Check for typos in variable names
   - Verify JWT secret key configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support, please:
- Open an issue in the GitHub repository
- Contact the maintainers

## Acknowledgments

- Django and React communities for their excellent frameworks