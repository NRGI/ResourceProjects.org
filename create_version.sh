#!/usr/bin/env bash

cat > public/version.txt << EOF
{
  "commit_sha": "$COMMIT",
  "image": "nrgi/resourceprojects.org:$BRANCH.$COMMIT"
}
EOF
