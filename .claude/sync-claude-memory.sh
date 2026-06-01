#!/bin/bash

# Determine project root and sanitized path (matches OpenClaude's logic)
PROJECT_ROOT=$(git rev-parse --show-toplevel)
SANITIZED_PATH=$(echo "$PROJECT_ROOT" | sed 's/[^a-zA-Z0-9]/-/g')

# Resolve OpenClaude config home (~/.openclaude or fallback to ~/.claude)
CONFIG_HOME="$HOME/.openclaude"
if [ ! -d "$CONFIG_HOME" ] && [ -d "$HOME/.claude" ]; then
  CONFIG_HOME="$HOME/.claude"
fi

GLOBAL_MEM_PATH="$CONFIG_HOME/projects/$SANITIZED_PATH/memory/"
LOCAL_MEM_PATH="$PROJECT_ROOT/.claude/memory/"

if [ "$1" == "pull" ]; then
  echo "Pulling memory from global OpenClaude to local..."
  mkdir -p "$LOCAL_MEM_PATH"
  rsync -av --delete --include="*/" --include="*.md" --exclude="*" "$GLOBAL_MEM_PATH" "$LOCAL_MEM_PATH"
  
  # Add to git automatically (useful when called via pre-commit)
  git add "$LOCAL_MEM_PATH"
  echo "Memory pulled successfully."
elif [ "$1" == "push" ]; then
  echo "Pushing memory from local to global OpenClaude..."
  mkdir -p "$GLOBAL_MEM_PATH"
  rsync -av --delete --include="*/" --include="*.md" --exclude="*" "$LOCAL_MEM_PATH" "$GLOBAL_MEM_PATH"
  echo "Memory pushed successfully."
else
  echo "Usage: ./.claude/sync-claude-memory.sh [pull|push]"
  exit 1
fi
