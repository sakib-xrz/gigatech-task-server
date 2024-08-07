FROM node:22-alpine

# Create an app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json package-lock.json ./

# RUN npm install
RUN npm install

# Bundle app source
COPY . .

# Expose the port
EXPOSE 8000

# Start the app
CMD [ "npm", "start" ]

