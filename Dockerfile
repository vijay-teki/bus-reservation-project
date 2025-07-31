# Use an official OpenJDK 17 runtime as a base image
FROM openjdk:17-jdk-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven wrapper and pom.xml to leverage Docker caching
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# --- FIX: Add execute permission to the Maven wrapper ---
RUN chmod +x ./mvnw

# Download dependencies (this step is cached if pom.xml doesn't change)
RUN ./mvnw dependency:go-offline

# Copy the rest of your application's source code
COPY src ./src

# Package the application into a JAR file, skipping tests
RUN ./mvnw package -DskipTests

# Tell Docker that the container listens on port 8080
EXPOSE 8080

# The command to run when the container starts
ENTRYPOINT ["java", "-jar", "target/bus_reservation-0.0.1-SNAPSHOT.jar"]
