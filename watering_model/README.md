# Build và chạy bằng Docker
docker build -t watering-system .
docker run -d --name smart-watering-system -p 5001:5001 -v ./models:/app/models watering-system

# Smart Plant Watering System

A machine learning-based system that automatically decides when to water plants and how much water to provide based on environmental sensor data.

## Overview

This project implements an intelligent plant watering system that uses machine learning models to make watering decisions. The system reads real-time sensor data including soil moisture, temperature, light levels, and water tank levels to determine:

1. Whether plants need watering at a given time
2. How much water to provide if watering is necessary

## Components

### Core Files

- `watering_simulation.py`: Main service that loads models and makes watering decisions
- `latest_data.json`: JSON file containing the most recent sensor readings

### Trained Models

The system uses two pretrained machine learning models:

- `models/watering_decision_model.pkl`: Decides whether to water based on sensor data
- `models/water_amount_model.pkl`: Determines how much water to provide if watering is needed

## Features

- **Data-driven decisions**: Uses machine learning to optimize watering based on environmental conditions
- **Real-time monitoring**: Reads the latest sensor data to make timely decisions
- **Simulation capability**: Supports testing different scenarios with varying moisture and temperature levels
- **Water conservation**: Provides just the right amount of water needed, avoiding waste

## Usage

### Basic Usage

```python
from watering_simulation import WateringSystem

# Initialize the system
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

# Check the decision
if result["should_water"]:
    print(f"Watering recommended: {result['water_amount_litres']} litres")
else:
    print("No watering needed at this time")
```

### Simulating Scenarios

You can simulate specific scenarios to test how the system would respond:

```python
# Simulate drought conditions
dry_scenario = system.simulate_scenario(soil_moisture=15, temperature=32)

# Simulate well-watered conditions
wet_scenario = system.simulate_scenario(soil_moisture=80, temperature=25)
```

## Input Features

The system uses the following input features for making decisions:

- `soil_moisture_1(%)`: Primary soil moisture sensor reading (%)
- `soil_moisture_2(%)`: Secondary soil moisture sensor reading (%)
- `temperature(°C)`: Ambient temperature in Celsius
- `light_level(lux)`: Light intensity in lux
- `water_level(%)`: Water tank level (%)
- `hour`: Current hour of the day (0-23)
- `day_of_week`: Current day of the week (0-6, where 0 is Monday)

## System Integration

This watering decision service is designed to be integrated into larger IoT systems. You can:

1. Run it on a Raspberry Pi or similar device connected to sensors
2. Call the service via API to get watering decisions
3. Connect it to automated watering equipment for a fully automated solution

## Dependencies

- Python 3.6+
- pandas
- numpy
- scikit-learn (for the trained models)
- joblib (for loading models)

## Installation

1. Clone this repository
2. Install required dependencies: `pip install pandas numpy scikit-learn joblib`
3. Ensure your sensor data is being written to `latest_data.json` in the correct format
4. Run the service: `python watering_simulation.py`

## Future Improvements

- Web dashboard for monitoring and adjusting system parameters
- Support for additional sensors (humidity, rain detection, etc.)
- Plant-specific watering profiles
- Seasonal adjustment capabilities

# Watering Decision Model API

## Mô tả
API tích hợp AI model để đưa ra quyết định tưới nước thông minh dựa trên dữ liệu cảm biến.

## Endpoints

### 1. Lấy quyết định tưới nước cho vườn
```
GET /watering-decision/garden/{gardenId}
```

**Mô tả**: Lấy dữ liệu cảm biến mới nhất của vườn và gửi đến AI model để nhận quyết định tưới nước.

**Parameters**:
- `gardenId` (path): ID của vườn

**Response**:
```json
{
  "decision": "water_now",
  "confidence": 85.3,
  "reasons": ["Độ ẩm đất thấp", "Nhiệt độ cao"],
  "recommended_amount": 2.5,
  "sensor_data": {
    "soil_moisture": 35.5,
    "air_humidity": 65.2,
    "temperature": 28.3,
    "light_intensity": 15000
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Tạo quyết định với dữ liệu tùy chỉnh
```
POST /watering-decision/garden/{gardenId}/custom
```

**Request Body**:
```json
{
  "sensorData": {
    "soil_moisture": 40.0,
    "air_humidity": 70.0,
    "temperature": 25.0,
    "light_intensity": 12000
  },
  "notes": "Kiểm tra thủ công"
}
```

### 3. Thống kê quyết định tưới nước
```
GET /watering-decision/garden/{gardenId}/stats?days=7
```

**Parameters**:
- `gardenId` (path): ID của vườn
- `days` (query, optional): Số ngày thống kê (mặc định: 7)

**Response**:
```json
{
  "gardenId": 1,
  "totalDecisions": 45,
  "waterRecommendations": 20,
  "noWaterRecommendations": 25,
  "averageConfidence": 78.5,
  "averageWaterAmount": 2.8,
  "fromDate": "2024-01-08T00:00:00Z",
  "toDate": "2024-01-15T23:59:59Z"
}
```

### 4. Kiểm tra kết nối AI model
```
GET /watering-decision/test-ai
```

## AI Model Integration

### Model URL
- Default: `http://localhost:5001`
- Endpoint: `/watering/decision`

### Model Input Format
```json
{
  "sensor_data": {
    "soil_moisture": 35.5,
    "air_humidity": 65.2,
    "temperature": 28.3,
    "light_intensity": 15000
  }
}
```

### Model Output Format
```json
{
  "decision": "water_now",
  "confidence": 85.3,
  "reasons": ["Độ ẩm đất thấp", "Nhiệt độ cao"],
  "recommended_amount": 2.5
}
```

## Sensor Types Required
- `SOIL_MOISTURE`: Độ ẩm đất (0-100%)
- `AIR_HUMIDITY`: Độ ẩm không khí (0-100%)  
- `TEMPERATURE`: Nhiệt độ (-50 to 70°C)
- `LIGHT_INTENSITY`: Cường độ ánh sáng (0-200000 lux)

## Error Handling
- 400: Dữ liệu đầu vào không hợp lệ
- 403: Không có quyền truy cập vườn
- 404: Không tìm thấy vườn/dữ liệu cảm biến
- 500: Lỗi AI model hoặc server nội bộ

## Usage Example

### 1. Khởi động AI Model
```bash
cd watering_model
python app.py
```

### 2. Gọi API từ frontend
```javascript
// Lấy quyết định tưới nước
const response = await fetch('/api/watering-decision/garden/1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const decision = await response.json();

if (decision.decision === 'water_now') {
  console.log(`Cần tưới ${decision.recommended_amount} lít`);
  console.log('Lý do:', decision.reasons.join(', '));
}
```

### 3. Tự động tạo lịch tưới
```javascript
// Kết hợp với watering schedule API
const decision = await getWateringDecision(gardenId);
if (decision.decision === 'water_now') {
  await createWateringSchedule(gardenId, {
    scheduledAt: new Date(),
    amount: decision.recommended_amount,
    notes: `AI: ${decision.reasons.join(', ')}`
  });
}
```
