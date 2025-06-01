import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime

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
            model = joblib.load(path)
            print(f"{name} loaded successfully")
            return model
        except FileNotFoundError:
            print(f"Warning: {name} not found!")
            return None
    
    def __init__(self):
        """Initialize the watering system by loading trained models"""
        self.decision_model = self._load_model(DECISION_MODEL_PATH, "Watering decision model")
        self.amount_model = self._load_model(AMOUNT_MODEL_PATH, "Water amount model")
            
        # Define the features used by our models
        self.features = [
            'soil_moisture_1(%)', 'soil_moisture_2(%)', 'temperature(°C)', 
            'light_level(lux)', 'water_level(%)', 'hour', 'day_of_week'
        ]
    
    def get_latest_sensor_data(self):
        """
        Load the latest sensor data from the JSON file
        """
        try:
            with open('latest_data.json') as f:
                data = json.load(f)
            
            # Extract feature values
            current_data = {}
            current_data['soil_moisture_1(%)'] = float(data['soil_moisture_1(%)'][0]['value'])
            current_data['soil_moisture_2(%)'] = float(data['soil_moisture_2(%)'][0]['value'])
            current_data['temperature(°C)'] = float(data['temperature(°C)'][0]['value'])
            current_data['light_level(lux)'] = float(data['light_level(lux)'][0]['value'])
            current_data['water_level(%)'] = float(data['water_level(%)'][0]['value'])
            
            # Add time features
            timestamp = pd.to_datetime(data['temperature(°C)'][0]['timestamp'])
            current_data['hour'] = timestamp.hour
            current_data['day_of_week'] = timestamp.dayofweek
            
            # Convert to DataFrame
            return pd.DataFrame([current_data])
        
        except Exception as e:
            print(f"Error loading latest sensor data: {e}")
            return None
    
    def make_watering_decision(self, sensor_data=None):
        """
        Decide whether to water based on sensor data
        
        Args:
            sensor_data: DataFrame with sensor readings. If None, latest data is used.
            
        Returns:
            dict: Decision results including watering need and amount
        """
        if self.decision_model is None:
            return {"error": "Decision model not loaded"}
            
        if sensor_data is None:
            sensor_data = self.get_latest_sensor_data()
            
        if sensor_data is None:
            return {"error": "No sensor data available"}
            
        # Ensure all required features are present
        for feature in self.features:
            if feature not in sensor_data.columns:
                return {"error": f"Missing feature: {feature}"}
                
        # Make watering decision prediction
        should_water = self.decision_model.predict(sensor_data[self.features])[0]
        
        result = {
            "should_water": bool(should_water),
            "soil_moisture_1": float(sensor_data['soil_moisture_1(%)'].values[0]),
            "soil_moisture_2": float(sensor_data['soil_moisture_2(%)'].values[0]),
            "temperature": float(sensor_data['temperature(°C)'].values[0]),
            "light_level": float(sensor_data['light_level(lux)'].values[0]),
            "water_level": float(sensor_data['water_level(%)'].values[0]),
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # If watering is needed, predict amount
        if should_water and self.amount_model is not None:
            water_amount = self.amount_model.predict(sensor_data[self.features])[0]
            result["water_amount_litres"] = float(water_amount)
        else:
            result["water_amount_litres"] = 0.0
            
        return result
    
    def simulate_scenario(self, soil_moisture, temperature, light_level=None, water_level=None):
        """
        Simulate a specific scenario with given parameters
        
        Args:
            soil_moisture: Soil moisture percentage
            temperature: Temperature in Celsius
            light_level: Optional light level in lux
            water_level: Optional water tank level percentage
            
        Returns:
            dict: Decision results for the scenario
        """
        # Get baseline from latest data
        baseline = self.get_latest_sensor_data()
        if baseline is None:
            return {"error": "No baseline data available for simulation"}
            
        # Create a copy of baseline
        scenario = baseline.copy()
        
        # Update with provided parameters
        scenario['soil_moisture_1(%)'] = soil_moisture
        scenario['soil_moisture_2(%)'] = soil_moisture
        scenario['temperature(°C)'] = temperature
        
        if light_level is not None:
            scenario['light_level(lux)'] = light_level
            
        if water_level is not None:
            scenario['water_level(%)'] = water_level
            
        # Get prediction
        decision = self.make_watering_decision(scenario)
        decision['scenario_moisture'] = soil_moisture
        decision['scenario_temperature'] = temperature
        
        return decision

if __name__ == "__main__":
    system = WateringSystem()

    # Create a sample sensor data DataFrame for testing
    sample_data = pd.DataFrame([{
        "soil_moisture_1(%)": 35.0,
        "soil_moisture_2(%)": 35.0,
        "temperature(°C)": 25.0,
        "light_level(lux)": 1500.0,
        "water_level(%)": 80.0,
        "hour": 10,
        "day_of_week": 2
    }])
    
    # Make a watering decision based on latest sensor data
    result = system.make_watering_decision(sample_data)
    
    # Display results
    print("\nCurrent Watering Decision:")
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Timestamp: {result['timestamp']}")
        print(f"Soil Moisture: {result['soil_moisture_1']}%, {result['soil_moisture_2']}%")
        print(f"Temperature: {result['temperature']}°C")
        print(f"Light Level: {result['light_level']} lux")
        print(f"Water Level: {result['water_level']}%")
        print(f"Should water? {'Yes' if result['should_water'] else 'No'}")
        
        if result['should_water']:
            print(f"Recommended water amount: {result['water_amount_litres']:.2f} litres")