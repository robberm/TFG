FROM eclipse-temurin:23-jdk 


WORKDIR /app

# Copy JAR file into  container
COPY target/tfgapp-0.0.1-SNAPSHOT.jar app.jar 

# Expose  port  app runs on
EXPOSE 8080

# Run  app
ENTRYPOINT ["java", "-jar", "app.jar"]

