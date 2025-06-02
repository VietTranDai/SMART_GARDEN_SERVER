const axios = require('axios');

async function testAIModelIntegration() {
  const AI_MODEL_URL = 'http://localhost:5001';
  
  console.log('🧪 Testing AI Model Integration...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${AI_MODEL_URL}/health`);
    console.log('✅ Health check passed');
    console.log('📊 Model status:', healthResponse.data.models_loaded);
    console.log('📋 Required features:', healthResponse.data.features);
    console.log('');

    // Test 2: Watering decision with correct format
    console.log('2. Testing watering decision endpoint...');
    const testData = {
      'soil_moisture_1(%)': 35.5,
      'soil_moisture_2(%)': 35.5,
      'temperature(°C)': 28.3,
      'light_level(lux)': 15000,
      'water_level(%)': 80.0,
      'hour': new Date().getHours(),
      'day_of_week': new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    };

    console.log('📤 Sending data:', testData);
    
    const decisionResponse = await axios.post(`${AI_MODEL_URL}/watering/decision`, testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('📥 AI Response:', decisionResponse.data);
    
    if (decisionResponse.data.success) {
      console.log('✅ Decision endpoint working');
      console.log(`🌱 Should water: ${decisionResponse.data.should_water}`);
      console.log(`💧 Water amount: ${decisionResponse.data.water_amount_litres} litres`);
    } else {
      console.log('❌ Decision endpoint failed:', decisionResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 AI Model server is not running on port 5001');
      console.error('💡 Please start the AI model first:');
      console.error('   cd watering_model');
      console.error('   python app.py');
    } else if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    } else {
      console.error('🔍 Error details:', error.message);
    }
  }
}

// Run the test
testAIModelIntegration(); 