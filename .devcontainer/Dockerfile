FROM mcr.microsoft.com/devcontainers/typescript-node:1-22

# Chromium used by Puppeteer to render registration PDFs from HTML templates.
RUN apt-get update && apt-get install -y --no-install-recommends chromium && rm -rf /var/lib/apt/lists/*

# Install development tools
RUN npm i -g @angular/cli @nestjs/cli @smallhillcz/sdk

# bash completion scripts
RUN npm completion >> /home/node/.bashrc
RUN ng completion script >> /home/node/.bashrc