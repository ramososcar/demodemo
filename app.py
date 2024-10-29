from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS, cross_origin
import pandas as pd
import os
import tempfile
import logging


app = Flask(__name__, template_folder='templates')
CORS(app)

app.config['UPLOAD_FOLDER'] = 'uploads'
logging.basicConfig(level=logging.ERROR)

def validar_archivo(request):
    if 'excelFile' not in request.files:
        return None, {'error': 'No se encontró el archivo'}
    
    file = request.files['excelFile']
    
    if file.filename == '':
        return None, {'error': 'No se seleccionó ningún archivo'}
    
    if not file.filename.endswith(('.xls', '.xlsx')):
        return None, {'error': 'El archivo debe ser un archivo de Excel (.xls, .xlsx)'}
    
    return file, None

def validar_columnas(df, required_columns):
    return all(col in df.columns for col in required_columns)

def log_error(e):
    logging.error(f'Error: {str(e)}')

@app.route('/')
def index():
    return render_template('index.html'), 200

@app.route('/upload', methods=['POST'])
@cross_origin()
def upload_file():
    file, error = validar_archivo(request)
    if error:
        return jsonify(error), 400
    
    try:
        df = pd.read_excel(file)
        required_columns = ['Nombre', 'Pases', 'Frase']
        if not validar_columnas(df, required_columns):
            return jsonify({'error': 'El archivo no contiene las columnas requeridas'}), 400
        
        data = df.to_dict(orient='records')
        return jsonify(data), 200
    except Exception as e:
        log_error(e)
        return jsonify({'error': str(e)}), 500

@app.route('/export', methods=['POST'])
def export_file():
    try:
        data = request.json
        df = pd.DataFrame(data)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            df.to_excel(tmp.name, index=False)
            tmp.flush()  # Asegurarse de que los datos se guarden en el disco
            return send_file(tmp.name, as_attachment=True, download_name='eventos.xlsx')
    except Exception as e:
        log_error(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True)
