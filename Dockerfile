# Stage 1: Build the React Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Pre-create the relative target output folder to match vite.config.js path
RUN mkdir -p ../backend/src/main/resources/static
RUN npm run build

# Stage 2: Build the Spring Boot Backend
FROM maven:3.8.8-eclipse-temurin-17 AS backend-builder
WORKDIR /app
COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src/
# Copy the compiled static assets from the frontend build stage
COPY --from=frontend-builder /app/backend/src/main/resources/static/ ./backend/src/main/resources/static/
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Stage 3: Run the Application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
