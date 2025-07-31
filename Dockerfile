# --- Stage 1: Build the application ---
FROM openjdk:21-jdk-slim AS builder

WORKDIR /app

# Copy the Maven wrapper and pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Add execute permission
RUN chmod +x ./mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy the rest of the source code
COPY src ./src

# Package the application
RUN ./mvnw package -DskipTests

# --- Stage 2: Create the final, lightweight image ---
FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy only the built JAR file from the builder stage
COPY --from=builder /app/target/bus-reservation-0.0.1-SNAPSHOT.jar app.jar

# Expose the port
EXPOSE 8080

# The command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
