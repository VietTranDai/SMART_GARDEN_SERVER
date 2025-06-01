#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Plant Disease Detection AI Service
Complete Flask Web Service with UI and API
Author: VietTranDai
Version: 1.0.0
Date: 2025-05-31
"""

import os
import sys
import logging
import unicodedata
from datetime import datetime
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge

import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_cors import CORS
from PIL import Image
import io

# ================= CONFIGURATION ================= #
class Config:
    # Model Configuration
    IMG_SIZE = 224
    TFLITE_PATH = os.environ.get('TFLITE_PATH', './InceptionResNetV2_improved.tflite')
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'plant-disease-ai-secret-key-2025')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Upload Configuration
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    
    # Server Configuration
    HOST = os.environ.get('FLASK_HOST', '0.0.0.0')
    PORT = int(os.environ.get('FLASK_PORT', 5000))
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    # Logging Configuration
    LOG_LEVEL = logging.INFO
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# ================= PLANT DISEASE CLASSES ================= #
ALL_CLASSES = [
    'Apple___Apple_scab','Apple___Black_rot','Apple___Cedar_apple_rust','Apple___healthy',
    'Blueberry___healthy','Cherry_(including_sour)___Powdery_mildew','Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot','Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight','Corn_(maize)___healthy',
    'Grape___Black_rot','Grape___Esca_(Black_Measles)','Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy','Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot','Peach___healthy','Pepper,_bell___Bacterial_spot','Pepper,_bell___healthy',
    'Potato___Early_blight','Potato___Late_blight','Potato___healthy',
    'Raspberry___healthy','Soybean___healthy','Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch','Strawberry___healthy',
    'Tomato___Bacterial_spot','Tomato___Early_blight','Tomato___Late_blight',
    'Tomato___Leaf_Mold','Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite','Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus','Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

VIET_NAMES = {
    'Apple___Apple_scab':'Bệnh ghẻ táo',
    'Apple___Black_rot':'Bệnh thối đen trên táo',
    'Apple___Cedar_apple_rust':'Bệnh rỉ sắt táo tuyết tùng',
    'Apple___healthy':'Táo khỏe mạnh',
    'Blueberry___healthy':'Việt quất khỏe mạnh',
    'Cherry_(including_sour)___Powdery_mildew':'Bệnh phấn trắng trên anh đào',
    'Cherry_(including_sour)___healthy':'Anh đào khỏe mạnh',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot':'Bệnh đốm lá trên ngô',
    'Corn_(maize)___Common_rust_':'Bệnh rỉ sắt trên ngô',
    'Corn_(maize)___Northern_Leaf_Blight':'Bệnh cháy lá phương bắc trên ngô',
    'Corn_(maize)___healthy':'Ngô khỏe mạnh',
    'Grape___Black_rot':'Bệnh thối đen trên nho',
    'Grape___Esca_(Black_Measles)':'Bệnh sởi đen trên nho',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)':'Bệnh đốm lá trên nho',
    'Grape___healthy':'Nho khỏe mạnh',
    'Orange___Haunglongbing_(Citrus_greening)':'Bệnh vàng lá cam',
    'Peach___Bacterial_spot':'Bệnh đốm vi khuẩn trên đào',
    'Peach___healthy':'Đào khỏe mạnh',
    'Pepper,_bell___Bacterial_spot':'Bệnh đốm vi khuẩn trên ớt chuông',
    'Pepper,_bell___healthy':'Ớt chuông khỏe mạnh',
    'Potato___Early_blight':'Bệnh mốc sớm trên khoai tây',
    'Potato___Late_blight':'Bệnh mốc muộn trên khoai tây',
    'Potato___healthy':'Khoai tây khỏe mạnh',
    'Raspberry___healthy':'Phúc bồn tử khỏe mạnh',
    'Soybean___healthy':'Đậu tương khỏe mạnh',
    'Squash___Powdery_mildew':'Bệnh phấn trắng trên bí',
    'Strawberry___Leaf_scorch':'Bệnh cháy lá trên dâu',
    'Strawberry___healthy':'Dâu khỏe mạnh',
    'Tomato___Bacterial_spot':'Bệnh đốm vi khuẩn trên cà chua',
    'Tomato___Early_blight':'Bệnh mốc sớm trên cà chua',
    'Tomato___Late_blight':'Bệnh mốc muộn trên cà chua',
    'Tomato___Leaf_Mold':'Bệnh mốc lá trên cà chua',
    'Tomato___Septoria_leaf_spot':'Bệnh đốm lá Septoria trên cà chua',
    'Tomato___Spider_mites Two-spotted_spider_mite':'Bệnh nhện đỏ hai chấm trên cà chua',
    'Tomato___Target_Spot':'Bệnh đốm mục tiêu trên cà chua',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus':'Bệnh virus vàng xoăn lá trên cà chua',
    'Tomato___Tomato_mosaic_virus':'Bệnh virus khảm trên cà chua',
    'Tomato___healthy':'Cà chua khỏe mạnh'
}

def normalize_text(text: str) -> str:
    """Normalize text by removing accents and converting to lowercase"""
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return text.lower().replace(' ', '').replace('_', '')

PLANT_ALIAS = {
    # Vietnamese names - Updated with preferred names
    normalize_text('Cây táo'): 'Apple',
    normalize_text('Cây việt quất'): 'Blueberry',
    normalize_text('Cây anh đào'): 'Cherry_(including_sour)',
    normalize_text('Cây ngô'): 'Corn_(maize)',
    normalize_text('Cây bắp'): 'Corn_(maize)',
    normalize_text('Cây nho'): 'Grape',
    normalize_text('Cây cam'): 'Orange',
    normalize_text('Cây đào'): 'Peach',
    normalize_text('Cây ớt'): 'Pepper,_bell',
    normalize_text('Cây ớt chuông'): 'Pepper,_bell',
    normalize_text('Cây khoai tây'): 'Potato',
    normalize_text('Cây mâm xôi'): 'Raspberry',
    normalize_text('Cây phúc bồn tử'): 'Raspberry',
    normalize_text('Cây đậu tương'): 'Soybean',
    normalize_text('Cây bí'): 'Squash',
    normalize_text('Cây dâu'): 'Strawberry',
    normalize_text('Cây dâu tây'): 'Strawberry',
    normalize_text('Cây cà chua'): 'Tomato',
    
    # Backward compatibility - keep old names working
    normalize_text('táo'): 'Apple',
    normalize_text('việt quất'): 'Blueberry',
    normalize_text('anh đào'): 'Cherry_(including_sour)',
    normalize_text('ngô'): 'Corn_(maize)',
    normalize_text('bắp'): 'Corn_(maize)',
    normalize_text('nho'): 'Grape',
    normalize_text('cam'): 'Orange',
    normalize_text('đào'): 'Peach',
    normalize_text('ớt'): 'Pepper,_bell',
    normalize_text('ớt chuông'): 'Pepper,_bell',
    normalize_text('khoai tây'): 'Potato',
    normalize_text('mâm xôi'): 'Raspberry',
    normalize_text('phúc bồn tử'): 'Raspberry',
    normalize_text('đậu tương'): 'Soybean',
    normalize_text('bí'): 'Squash',
    normalize_text('dâu'): 'Strawberry',
    normalize_text('dâu tây'): 'Strawberry',
    normalize_text('cà chua'): 'Tomato',
    
    # English names
    'apple': 'Apple', 'blueberry': 'Blueberry', 'cherry': 'Cherry_(including_sour)',
    'corn': 'Corn_(maize)', 'maize': 'Corn_(maize)', 'grape': 'Grape', 
    'orange': 'Orange', 'peach': 'Peach', 'pepper': 'Pepper,_bell', 
    'bellpepper': 'Pepper,_bell', 'potato': 'Potato', 'raspberry': 'Raspberry',
    'soybean': 'Soybean', 'squash': 'Squash', 'strawberry': 'Strawberry', 
    'tomato': 'Tomato'
}

# ================= AI DETECTOR CLASS ================= #
class PlantDiseaseDetector:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        self.logger = logging.getLogger(__name__)
        self._load_model()
    
    def _load_model(self):
        """Load TensorFlow Lite model"""
        try:
            # Try multiple possible paths
            possible_paths = [
                self.model_path,
                os.path.join(os.getcwd(), 'InceptionResNetV2_improved.tflite'),
                os.path.join('/app', 'InceptionResNetV2_improved.tflite'),
                os.path.join('/app/model', 'InceptionResNetV2_improved.tflite')
            ]
            
            model_found = False
            for path in possible_paths:
                if os.path.exists(path):
                    self.model_path = path
                    model_found = True
                    self.logger.info(f"✅ Found model at: {path}")
                    break
            
            if not model_found:
                raise FileNotFoundError(f"❌ Model file not found in any of: {possible_paths}")
            
            self.interpreter = tf.lite.Interpreter(model_path=self.model_path, num_threads=4)
            self.interpreter.allocate_tensors()
            
            self.input_details = self.interpreter.get_input_details()[0]
            self.output_details = self.interpreter.get_output_details()[0]
            
            self.logger.info("✅ TensorFlow Lite model loaded successfully")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to load model: {str(e)}")
            raise
    
    def _preprocess_image(self, image_array: np.ndarray) -> np.ndarray:
        """Preprocess image for model inference"""
        if self.input_details['dtype'] == np.float32:
            return image_array.astype(np.float32) / 255.0
        
        scale, zero_point = self.input_details['quantization']
        return ((image_array / 255.0) / scale + zero_point).astype(self.input_details['dtype'])
    
    def _postprocess_output(self, output_tensor: np.ndarray) -> np.ndarray:
        """Postprocess model output"""
        if self.output_details['dtype'] == np.float32:
            return output_tensor
        
        scale, zero_point = self.output_details['quantization']
        return (output_tensor.astype(np.float32) - zero_point) * scale
    
    def _get_plant_prefix(self, plant_name: str = None) -> str:
        """Get plant prefix from plant name"""
        if not plant_name:
            return None
        
        normalized_name = normalize_text(plant_name)
        return PLANT_ALIAS.get(normalized_name, None)
    
    def predict(self, image_path: str, plant_type: str = None) -> dict:
        """Predict plant disease from image"""
        try:
            start_time = datetime.now()
            
            # Load and preprocess image
            image = load_img(image_path, target_size=(Config.IMG_SIZE, Config.IMG_SIZE))
            image_array = img_to_array(image)
            processed_image = self._preprocess_image(image_array)
            
            # Run inference
            self.interpreter.set_tensor(self.input_details['index'], np.expand_dims(processed_image, 0))
            self.interpreter.invoke()
            
            # Get and postprocess output
            output = self.interpreter.get_tensor(self.output_details['index'])[0]
            probabilities = self._postprocess_output(output)
            
            # Filter by plant type if specified
            plant_prefix = self._get_plant_prefix(plant_type)
            if plant_prefix:
                filtered_indices = [
                    i for i, class_name in enumerate(ALL_CLASSES)
                    if class_name.startswith(plant_prefix + "___")
                ]
                
                if not filtered_indices:
                    raise ValueError(f"No classes found for plant type: {plant_type}")
                
                filtered_probs = probabilities[filtered_indices]
                filtered_probs = filtered_probs / filtered_probs.sum()
                
                best_local_idx = int(np.argmax(filtered_probs))
                best_idx = filtered_indices[best_local_idx]
                confidence = float(filtered_probs[best_local_idx])
                
                all_predictions = [
                    {
                        'class_en': ALL_CLASSES[idx],
                        'class_vi': VIET_NAMES.get(ALL_CLASSES[idx], ALL_CLASSES[idx]),
                        'confidence': float(filtered_probs[i]),
                        'confidence_percent': float(filtered_probs[i] * 100)
                    }
                    for i, idx in enumerate(filtered_indices)
                ]
            else:
                best_idx = int(np.argmax(probabilities))
                confidence = float(probabilities[best_idx])
                
                all_predictions = [
                    {
                        'class_en': class_name,
                        'class_vi': VIET_NAMES.get(class_name, class_name),
                        'confidence': float(prob),
                        'confidence_percent': float(prob * 100)
                    }
                    for class_name, prob in zip(ALL_CLASSES, probabilities)
                ]
            
            # Sort predictions by confidence
            all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                'success': True,
                'prediction': {
                    'class_en': ALL_CLASSES[best_idx],
                    'class_vi': VIET_NAMES.get(ALL_CLASSES[best_idx], ALL_CLASSES[best_idx]),
                    'confidence': confidence,
                    'confidence_percent': confidence * 100
                },
                'plant_filter': {
                    'applied': plant_type is not None,
                    'plant_type': plant_type,
                    'plant_prefix': plant_prefix
                },
                'all_predictions': all_predictions[:10],
                'total_classes': len(ALL_CLASSES),
                'filtered_classes': len(filtered_indices) if plant_prefix else len(ALL_CLASSES),
                'processing_time': round(processing_time, 3),
                'timestamp': datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            self.logger.error(f"Prediction error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# ================= FLASK APPLICATION ================= #
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Configure logging
    logging.basicConfig(level=Config.LOG_LEVEL, format=Config.LOG_FORMAT)
    
    # Create necessary directories
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Initialize AI detector
    try:
        detector = PlantDiseaseDetector(Config.TFLITE_PATH)
    except Exception as e:
        app.logger.error(f"Failed to initialize detector: {str(e)}")
        raise
    
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    
    def validate_image(file_stream):
        """Validate uploaded image"""
        try:
            image = Image.open(file_stream)
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            return True
        except Exception:
            return False
    
    # ================= WEB UI ROUTES ================= #
    
    @app.route('/')
    def index():
        """Main interface - serves both web UI and API documentation"""
        # Check if request wants JSON (API docs)
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'service': 'Plant Disease Detection AI',
                'version': '1.0.0',
                'author': 'VietTranDai',
                'status': 'running',
                'endpoints': {
                    'GET /': 'Web interface and API documentation',
                    'POST /predict': 'Predict plant disease from image',
                    'POST /web-predict': 'Web form prediction',
                    'GET /health': 'Service health check',
                    'GET /classes': 'Get all disease classes',
                    'GET /plants': 'Get all plant types'
                },
                'model_info': {
                    'total_classes': len(ALL_CLASSES),
                    'supported_plants': len(set(PLANT_ALIAS.values())),
                    'model_path': detector.model_path
                },
                'features': [
                    'Web interface with drag & drop',
                    'REST API with JSON responses',
                    '38 disease classes support',
                    '14 plant types support',
                    'Vietnamese and English support',
                    'Real-time image validation',
                    'Confidence scoring',
                    'Plant type filtering'
                ],
                'supported_formats': list(Config.ALLOWED_EXTENSIONS),
                'max_file_size': '16MB',
                'timestamp': datetime.now().isoformat()
            })
        
        # Serve web interface
        return render_template('index.html')
    
    @app.route('/web-predict', methods=['POST'])
    def web_predict():
        """Web form prediction endpoint"""
        if 'file' not in request.files:
            flash('❌ Không có file nào được chọn!', 'error')
            return redirect(url_for('index'))
        
        file = request.files['file']
        plant_type = request.form.get('plant_type', '')
        
        if file.filename == '':
            flash('❌ Không có file nào được chọn!', 'error')
            return redirect(url_for('index'))
        
        if not allowed_file(file.filename):
            flash('❌ File không hợp lệ! Chỉ chấp nhận: PNG, JPG, JPEG, GIF, BMP, TIFF', 'error')
            return redirect(url_for('index'))
        
        try:
            # Validate image
            file.seek(0)
            if not validate_image(io.BytesIO(file.read())):
                flash('❌ File không phải là ảnh hợp lệ!', 'error')
                return redirect(url_for('index'))
            file.seek(0)
            
            # Save file temporarily
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
            file.save(filepath)
            
            try:
                # Run prediction
                result = detector.predict(filepath, plant_type if plant_type else None)
                result['filename'] = filename
                
                if result['success']:
                    flash(f'✅ Phân tích thành công! Kết quả: {result["prediction"]["class_vi"]}', 'success')
                else:
                    flash(f'❌ Lỗi phân tích: {result["error"]}', 'error')
                
                return render_template('index.html', result=result)
                
            finally:
                # Clean up
                try:
                    os.remove(filepath)
                except:
                    pass
                
        except Exception as e:
            flash(f'❌ Lỗi xử lý: {str(e)}', 'error')
            return redirect(url_for('index'))
    
    # ================= API ROUTES ================= #
    
    @app.route('/predict', methods=['POST'])
    def api_predict():
        """API prediction endpoint"""
        try:
            if 'image' not in request.files:
                return jsonify({'success': False, 'error': 'No image file provided'}), 400
            
            file = request.files['image']
            plant_type = request.form.get('plant_type', None)
            
            if file.filename == '':
                return jsonify({'success': False, 'error': 'No file selected'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({
                    'success': False, 
                    'error': f'Invalid file type. Allowed: {", ".join(Config.ALLOWED_EXTENSIONS)}'
                }), 400
            
            # Validate image
            file.seek(0)
            if not validate_image(io.BytesIO(file.read())):
                return jsonify({'success': False, 'error': 'Invalid image file'}), 400
            file.seek(0)
            
            # Save file temporarily
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            try:
                # Run prediction
                result = detector.predict(file_path, plant_type)
                
                # Add file info
                result['file_info'] = {
                    'original_filename': filename,
                    'file_size': os.path.getsize(file_path),
                    'file_size_mb': round(os.path.getsize(file_path) / (1024*1024), 2)
                }
                
                return jsonify(result)
                
            finally:
                # Clean up
                try:
                    os.remove(file_path)
                except:
                    pass
        
        except RequestEntityTooLarge:
            return jsonify({'success': False, 'error': 'File too large. Maximum size is 16MB'}), 413
        
        except Exception as e:
            app.logger.error(f"API prediction error: {str(e)}")
            return jsonify({
                'success': False, 
                'error': 'Internal server error',
                'details': str(e) if Config.DEBUG else None
            }), 500
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'service': 'Plant Disease Detection AI',
            'version': '1.0.0',
            'model_loaded': detector.interpreter is not None,
            'model_path': detector.model_path,
            'uptime': 'running',
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/classes', methods=['GET'])
    def get_classes():
        """Get all supported disease classes"""
        classes_info = []
        for class_en in ALL_CLASSES:
            classes_info.append({
                'class_en': class_en,
                'class_vi': VIET_NAMES.get(class_en, class_en),
                'plant_prefix': class_en.split('___')[0],
                'is_healthy': 'healthy' in class_en.lower()
            })
        
        return jsonify({
            'total_classes': len(ALL_CLASSES),
            'classes': classes_info
        })
    
    @app.route('/plants', methods=['GET'])
    def get_plants():
        """Get all supported plant types"""
        unique_prefixes = set(PLANT_ALIAS.values())
        plants_info = []
        
        for prefix in sorted(unique_prefixes):
            vi_names = [k for k, v in PLANT_ALIAS.items() if v == prefix and not k.isascii()]
            en_names = [k for k, v in PLANT_ALIAS.items() if v == prefix and k.isascii()]
            disease_count = len([c for c in ALL_CLASSES if c.startswith(prefix + "___")])
            
            plants_info.append({
                'prefix': prefix,
                'vietnamese_names': vi_names,
                'english_names': en_names,
                'disease_count': disease_count
            })
        
        return jsonify({
            'total_plants': len(unique_prefixes),
            'plants': plants_info
        })
    
    # ================= ERROR HANDLERS ================= #
    
    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith('/api') or request.headers.get('Accept') == 'application/json':
            return jsonify({'success': False, 'error': 'Endpoint not found'}), 404
        return render_template('error.html', error_code=404, error_message='Không tìm thấy trang'), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        if request.path.startswith('/api') or request.headers.get('Accept') == 'application/json':
            return jsonify({'success': False, 'error': 'Method not allowed'}), 405
        return render_template('error.html', error_code=405, error_message='Phương thức không được phép'), 405
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        if request.path.startswith('/api') or request.headers.get('Accept') == 'application/json':
            return jsonify({'success': False, 'error': 'File too large. Maximum size is 16MB'}), 413
        flash('❌ File quá lớn! Tối đa 16MB', 'error')
        return redirect(url_for('index'))
    
    @app.errorhandler(500)
    def internal_error(error):
        if request.path.startswith('/api') or request.headers.get('Accept') == 'application/json':
            return jsonify({'success': False, 'error': 'Internal server error'}), 500
        flash('❌ Lỗi hệ thống!', 'error')
        return redirect(url_for('index'))
    
    return app

# ================= APPLICATION ENTRY POINT ================= #
if __name__ == '__main__':
    print("🌱 Plant Disease Detection AI Service")
    print("=" * 50)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"👤 Author: VietTranDai")
    print(f"📁 Model: {Config.TFLITE_PATH}")
    print(f"🌐 Server: http://{Config.HOST}:{Config.PORT}")
    print(f"🎯 Features: Web UI + REST API")
    print("=" * 50)
    
    # Check model file
    if not os.path.exists(Config.TFLITE_PATH):
        print(f"❌ Model file not found: {Config.TFLITE_PATH}")
        print("Please ensure InceptionResNetV2_improved.tflite is in the current directory")
        sys.exit(1)
    
    # Create and run app
    app = create_app()
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG,
        threaded=True
    )