FROM mcr.microsoft.com/devcontainers/typescript-node:24

# Chromium used by Puppeteer to render registration PDFs from HTML templates.
# fonts-noto-color-emoji: without it Chromium has no emoji glyphs and renders tofu boxes in the PDF.
RUN apt-get update && apt-get install -y --no-install-recommends chromium fonts-noto-color-emoji && rm -rf /var/lib/apt/lists/*

# Install development tools
RUN npm i -g @angular/cli @nestjs/cli @smallhillcz/sdk

# bash completion scripts
RUN npm completion >> /home/node/.bashrc
RUN ng completion script >> /home/node/.bashrc