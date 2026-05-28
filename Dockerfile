# Tiny env-echo image. No npm install — the server uses only Node built-ins,
# so the build is just "copy one file", which keeps the hotbox build-on-host
# path fast to test.
FROM node:22-alpine
WORKDIR /app
COPY server.js ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
