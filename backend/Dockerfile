# Build stage
FROM maven:3.8-eclipse-temurin-11 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:11-jre
WORKDIR /app

# Install Tesseract OCR and dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the built jar
COPY --from=build /app/target/readingapp-1.0.0.jar app.jar
# Create directory structure for OcrService compatibility
RUN mkdir -p src/main/resources/tessdata uploads/documents

# Copy Tesseract data to the location expected by OcrService
COPY src/main/resources/tessdata src/main/resources/tessdata
RUN mkdir -p uploads/documents

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]