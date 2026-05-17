FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 py3-pillow
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG VITE_SITE_URL=
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
