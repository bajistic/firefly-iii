#!/bin/bash

# Script to set logging verbosity for Jarvis

case "$1" in
  "verbose"|"debug")
    echo "Setting VERBOSE logging mode"
    export VERBOSE_LOGGING=true
    export LOG_LEVEL=DEBUG
    ;;
  "quiet"|"minimal")
    echo "Setting MINIMAL logging mode (essential only)"
    export VERBOSE_LOGGING=false
    export LOG_LEVEL=INFO
    ;;
  "normal"|"info")
    echo "Setting NORMAL logging mode"
    export VERBOSE_LOGGING=false
    export LOG_LEVEL=INFO
    ;;
  *)
    echo "Usage: $0 [verbose|normal|quiet]"
    echo "  verbose - Show all debug messages and detailed logs"
    echo "  normal  - Show essential messages only (default)"
    echo "  quiet   - Same as normal, minimal console output"
    echo ""
    echo "Current settings:"
    echo "  VERBOSE_LOGGING=${VERBOSE_LOGGING:-false}"
    echo "  LOG_LEVEL=${LOG_LEVEL:-INFO}"
    exit 1
    ;;
esac

echo "Restart the server to apply changes"
echo "Or use: VERBOSE_LOGGING=$VERBOSE_LOGGING LOG_LEVEL=$LOG_LEVEL npm start"