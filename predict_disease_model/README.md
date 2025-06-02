docker build -t plant-disease-ai .
docker run -d --name predict_disease_model -p 5000:5000 plant-disease-ai