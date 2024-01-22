FROM node:20

# alpine linux utilities
# RUN apk add --no-cache git nano lsof openjdk8-jre
# RUN apk add --no-cache alpine-sdk python3  

# debian install java runtime
RUN apt-get update && apt-get install -y default-jre


# development tools
RUN npm i -g @angular/cli @nestjs/cli npm-check-updates

CMD /bin/sh -c "while sleep 1000; do :; done"