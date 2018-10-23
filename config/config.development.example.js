var path = require("path");

module.exports = {
  
  port: 3000,
  host: "127.0.0.1",

  api: {
    root: "/api",
    shareRoot: "https://example.com"
  },

  versions: {
    "name": "/path/to/dir"
  },
  
  uploads: {
    dir: "/tmp/uploads"
  },
  
  bcrypt: {
    rounds: 12
  },
  
  
  jwt: {
    secret: "top secret",
    expiration: "1 hour",
    credentialsRequired: false,
    defaultUserRole: "user"
  },
  
  database: {
    uri: "mongodb://localhost:27017/database-test",
    options:{
      useNewUrlParser: true
    }
  },
  
  photos: {
        storageDir: albumId => path.join(__dirname, "../data/photos_original", String(albumId)),
    storageUrl: "/data/photos_original",
    thumbsDir: albumId => path.join(__dirname, "../data/photos", String(albumId)),
    thumbsUrl: "/data/photos",
    allowedTypes: ["jpg","jpeg","png","gif"],
    sizes: {
      "big": [1024,1024],
      "small": [1024,340]
    }
  },
  
  events: {
    storageDir: path.join(__dirname, "../data/events"),
    eventDir: (eventId) => path.join(__dirname, "../data/events",eventId),
    storageUrl: "/data/events"
  },
  
  mongoExpress: {
    enabled: true,
    url: "/db",
    username: "username",
    password: "password",
    databases: ["database","database-test"]
  }
}