#!/bin/bash
if [ "$1" == "start" ]; then
    shift
    cd backend
    node dist/main.js

elif [ "$1" == "import" ]; then
    shift
    cd backend
    node dist/main-import.js "$@"

elif [ "$1" == "backend" ]; then
    shift
    cd backend
    node dist/main-cli.js "$@"

else
    # print help
    echo "Usage: $0 {start|import|backend} [args]"
    echo ""
    echo "Commands:"
    echo "  start                   start the app"
    echo "  import                  import data from old mongodb database"
    echo "  backend                 backend maintenance scripts" 
fi
