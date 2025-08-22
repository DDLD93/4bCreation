FROM node:21.7.1
LABEL author="Umar Adamu Jere"
WORKDIR /app
RUN apt-get update -y && apt-get install -y \
libxcomposite1 \
libnss3 \
libatk1.0-0 \
libatk-bridge2.0-0 \
libcups2 \
libxkbcommon0 \
libgbm1 \
libasound2 \
libxdamage1 \
libxrandr2 \
libxshmfence1 \
libxss1 \
libxtst6 \
libnss3-dev \
libnspr4 \
libpangocairo-1.0-0 \
libpangoft2-1.0-0 \
libpango-1.0-0 \
libcairo2 \
libcairo-gobject2 \
libxfixes3
COPY package.json .
RUN ["npm", "install"]
COPY src ./src
EXPOSE 3000
CMD ["npm", "start"]