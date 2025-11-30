FROM mcr.microsoft.com/devcontainers/typescript-node:1-22

# Install development tools
RUN npm i -g @angular/cli @nestjs/cli @smallhillcz/sdk

# bash completion scripts
RUN npm completion >> /home/node/.bashrc
RUN ng completion >> /home/node/.bashrc