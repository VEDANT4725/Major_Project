# Stage 1: Build the Spring Boot app
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B -q
COPY src ./src
RUN mvn package -DskipTests -B -q

# Stage 2: Run the app
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/target/blueprint-ai-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT java -jar app.jar --server.port=${PORT}
