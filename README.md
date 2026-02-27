# Grill Rent App

Grill Rent App is a web application that allows users to rent grills and tennis courts in a residential complex. It provides an easy-to-use interface for residents to book amenities and manage their reservations.

## Features

- User authentication (login/logout)
- Booking system for grills and tennis courts
- Calendar view for available dates
- User profile management
- Responsive design for mobile and desktop use
- Multi-language support (English, Spanish, Portuguese)
- Role-based access control (admin and resident roles)
- Toast notifications for user feedback

## Technologies Used

- React 18
- TypeScript
- Vite (for build tooling)
- React Router (for navigation)
- i18next (for internationalization)
- SWR (for data fetching)
- CSS Modules (for styling)
- Lucide React (for icons)
- Prettier (for code formatting)

## Project Structure

The project follows a component-based architecture:

- `src/components`: Reusable UI components
- `src/pages`: Main page components
- `src/hooks`: Custom React hooks
- `src/context`: React context providers
- `src/types`: TypeScript type definitions
- `src/locales`: Translation files
- `src/styles`: Global styles and variables

Key components include:
- `Header`: Navigation and user info
- `Footer`: Copyright and social links
- `BookingSection`: For creating new bookings
- `BookingList`: Displays and manages existing bookings
- `Calendar`: Date selection for bookings
- `LoginScreen`: User authentication
- `Profile`: User profile management

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js 20.x or later
- npm 9.x or later

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/gmbarroso/grillrentapp.git
   cd grillrentapp
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   REACT_APP_BFF_URL=https://grillrentbff.up.railway.app
   REACT_APP_BFF_URL_STAGING=https://grillrentbffv2-staging.up.railway.app
   REACT_APP_ENVIRONMENT=production
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:5173/login`.
2. Register a new account or log in with an existing account.
3. Navigate to the booking section to create a new booking.
4. View and manage your bookings in the booking list.

## Running Tests

To run tests, use the following command:
```sh
npm test
```

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or suggestions, feel free to reach out to the project maintainer at [barroso.guilherme@gmail.com].
