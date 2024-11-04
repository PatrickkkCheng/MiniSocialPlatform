FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

# 清除舊的構建文件
RUN rm -rf .next

RUN npm run build

# 添加執行權限給啟動腳本
RUN chmod +x ./scripts/start.sh

EXPOSE 3000

# 使用啟動腳本替代直接啟動命令
CMD ["./scripts/start.sh"] 