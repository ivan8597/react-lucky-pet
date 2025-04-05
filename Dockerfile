# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the React application
RUN npm run build

# Install a simple web server for serving static files
RUN npm install -g serve

# Expose the port on which the app will run
EXPOSE 3000

# Command to run the web server and serve the build directory
CMD ["serve", "-s", "build", "-l", "3000"]

