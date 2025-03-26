# Oak and Stone Construction Client Portal

## Overview
Oak and Stone Construction Client Portal is a web application designed to keep construction clients updated on project statuses in real time. The platform allows administrators to manage user accounts, create projects, and provide updates via text, files, and images, all within an intuitive interface. By streamlining communication, the app significantly reduces the need for phone calls and manual updates, improving overall efficiency.

## Features
- **User Management**: Admins can create user profiles with automated email notifications.
- **Project Creation**: Ability to create and manage multiple projects.
- **Real-Time Updates**: Upload and display text, file, and image updates for each project.
- **Full CRUD Functionality**: Users can Create, Read, Update, and Delete relevant project information.
- **Secure Access**: Role-based authentication to ensure only authorized users can access and modify data.
- **Responsive Design**: Optimized for both desktop and mobile users.

## Tech Stack
- **Frontend**: Pug
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: Passport Local Strategy
- **Storage**: Cloud-based storage for file and image uploads (Cloudinary)
- **Deployment**: Hosted on a cloud platform (Railway)

## Installation
### Prerequisites
- Node.js
- MongoDB
- Environment variables configured in a `.env` file

### Steps
1. Clone the repository:
   ```sh
   git clone git@github.com:Samuel-Duncan/oak-and-stone-website.git
   cd oak-and-stone-website
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up the `.env` file with required variables.
4. Start the development server:
   ```sh
   npm run dev
   ```

## Usage
1. Admins log in and create new client accounts.
2. Projects are added and assigned to clients.
3. Clients can log in to view project progress, updates, and files.
4. Admins can update project details, upload images, and share important documents.

## Future Enhancements
- Add a comments section for client-admin discussions.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## License
This project is licensed under the [MIT License](LICENSE).

---
Developed by **Samuel** in collaboration with Oak and Stone Construction.

