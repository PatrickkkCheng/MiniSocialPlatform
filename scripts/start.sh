#!/bin/sh

# 等待數據庫準備就緒
echo "Waiting for database to be ready..."
sleep 5

# 運行數據庫遷移
echo "Running database migrations..."
npx prisma migrate deploy

# 啟動應用
echo "Starting the application..."
npm start 