FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_ADMIN_APP_ENTRY=//127.0.0.1:7201/
ARG VITE_APP_ENV=production

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ADMIN_APP_ENTRY=${VITE_ADMIN_APP_ENTRY}
ENV VITE_APP_ENV=${VITE_APP_ENV}

RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/main/package.json apps/main/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/api/package.json packages/api/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/main/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
