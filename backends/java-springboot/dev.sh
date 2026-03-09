#!/bin/bash
# Use explicit Java 21 path from Homebrew
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH
echo "Using JAVA_HOME: $JAVA_HOME"
./mvnw spring-boot:run > /tmp/java-app.log 2>&1 &
echo $! > /tmp/java-app.pid
