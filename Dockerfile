# Social Spot: zero runtime dependencies; the website files are already built.
FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]
