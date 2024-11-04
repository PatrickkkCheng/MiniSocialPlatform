FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

RUN echo '#!/bin/sh\n\
echo "Waiting for database to be ready..."\n\
sleep 5\n\n\
echo "Running database migrations..."\n\
npx prisma migrate deploy\n\n\
echo "Starting the application..."\n\
npm start' > start.sh

RUN chmod +x start.sh

COPY . .

RUN rm -rf .next

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "./start.sh"] 