from flask import Flask, request, jsonify, render_template
import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# File paths
MODEL_DIR = 'models'
DECISION_MODEL_PATH = os.path.join(MODEL_DIR, 'watering_decision_model.pkl')
AMOUNT_MODEL_PATH = os.path.join(MODEL_DIR, 'water_amount_model.pkl')

class WateringSystem:
    """
    A class to encapsulate the watering decision system logic
    """
    
    def _load_model(self, path, name):
        """Helper method to load a model"""
        try:
            logger.info(f"Loading {name} from {path}")
            if os.path.exists(path):
                model = joblib.load(path)
                logger.info(f"{name} loaded successfully")
                return model
            else:
                logger.warning(f"Model file not found: {path}")
                return None
        except Exception as e:
            logger.error(f"Error loading {name}: {e}")
            return None
    
    def __init__(self):
        """Initialize the watering system by loading trained models"""
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        self.decision_model = self._load_model(DECISION_MODEL_PATH, "Watering decision model")
        self.amount_model = self._load_model(AMOUNT_MODEL_PATH, "Water amount model")
            
        # Define the features used by our models
        self.features = [
            'soil_moisture_1(%)', 'soil_moisture_2(%)', 'temperature(°C)', 
            'light_level(lux)', 'water_level(%)', 'hour', 'day_of_week'
        ]
    
    def make_watering_decision(self, sensor_data):
        """
        Decide whether to water based on sensor data
        """
        if self.decision_model is None:
            return {"error": "Decision model not loaded", "success": False}
            
        if sensor_data is None:
            return {"error": "No sensor data provided", "success": False}
            
        # Ensure all required features are present
        for feature in self.features:
            if feature not in sensor_data.columns:
                return {"error": f"Missing feature: {feature}", "success": False}
                
        try:
            # Make watering decision prediction
            should_water = self.decision_model.predict(sensor_data[self.features])[0]
            
            result = {
                "success": True,
                "should_water": bool(should_water),
                "soil_moisture_1": float(sensor_data['soil_moisture_1(%)'].values[0]),
                "soil_moisture_2": float(sensor_data['soil_moisture_2(%)'].values[0]),
                "temperature": float(sensor_data['temperature(°C)'].values[0]),
                "light_level": float(sensor_data['light_level(lux)'].values[0]),
                "water_level": float(sensor_data['water_level(%)'].values[0]),
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "hour": int(sensor_data['hour'].values[0]),
                "day_of_week": int(sensor_data['day_of_week'].values[0])
            }
            
            # If watering is needed, predict amount
            if should_water and self.amount_model is not None:
                water_amount = self.amount_model.predict(sensor_data[self.features])[0]
                result["water_amount_litres"] = float(water_amount)
            else:
                result["water_amount_litres"] = 0.0
                
            return result
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return {"error": f"Prediction error: {str(e)}", "success": False}

# Initialize the watering system
watering_system = WateringSystem()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "watering-system",
        "version": "1.0.0",
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "port": os.environ.get('PORT', 5001),
        "models_loaded": {
            "decision_model": watering_system.decision_model is not None,
            "amount_model": watering_system.amount_model is not None
        },
        "features": watering_system.features,
        "current_user": "VietTranDai"
    })

@app.route('/watering/decision', methods=['POST'])
def post_watering_decision():
    """Get watering decision based on provided sensor data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        # Validate required fields
        required_fields = watering_system.features
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {missing_fields}", 
                "success": False,
                "required_fields": required_fields
            }), 400
            
        # Convert to DataFrame
        sensor_data = pd.DataFrame([data])
        
        result = watering_system.make_watering_decision(sensor_data)
        
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500
        
    except Exception as e:
        logger.error(f"Error in watering decision POST endpoint: {e}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/')
def index():
    """Render the test UI"""
    return render_template('index.html')

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found", 
        "success": False,
        "available_endpoints": ["/", "/health", "/watering/decision"]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal server error", 
        "success": False,
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "error": "Bad request", 
        "success": False,
        "message": "Please check your request format and required fields"
    }), 400

# Add CORS support for development
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"🌱 Starting Smart Watering System on {host}:{port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info(f"👤 Current user: VietTranDai")
    logger.info(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    # Ensure required directories exist
    os.makedirs('models', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    app.run(host=host, port=port, debug=debug)