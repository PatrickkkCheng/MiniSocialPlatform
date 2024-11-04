FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

RUN echo "#!/bin/sh" > /app/start.sh && \
    echo "echo 'Waiting for database to be ready...'" >> /app/start.sh && \
    echo "sleep 5" >> /app/start.sh && \
    echo "echo 'Running database migrations...'" >> /app/start.sh && \
    echo "npx prisma migrate deploy" >> /app/start.sh && \
    echo "echo 'Starting the application...'" >> /app/start.sh && \
    echo "npm start" >> /app/start.sh

RUN chmod +x /app/start.sh

COPY . .

RUN rm -rf .next

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "/app/start.sh"] 